//go:build darwin

package main

/*
#include <ifaddrs.h>
#include <mach/mach.h>
#include <net/if.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <sys/sysctl.h>

static kern_return_t read_cpu_load(host_cpu_load_info_data_t *out) {
    mach_msg_type_number_t count = HOST_CPU_LOAD_INFO_COUNT;
    return host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, (host_info_t)out, &count);
}

static kern_return_t read_vm_stats(vm_statistics64_data_t *out) {
    mach_msg_type_number_t count = HOST_VM_INFO64_COUNT;
    return host_statistics64(mach_host_self(), HOST_VM_INFO64, (host_info64_t)out, &count);
}

static bool read_memsize(uint64_t *out) {
    size_t len = sizeof(*out);
    return sysctlbyname("hw.memsize", out, &len, NULL, 0) == 0;
}

static bool read_page_size(vm_size_t *out) {
    return host_page_size(mach_host_self(), out) == KERN_SUCCESS;
}
*/
import "C"

import (
	"errors"
	"fmt"
	"math"
	"os"
	"os/signal"
	"syscall"
	"time"
	"unsafe"
)

type CPUStats struct {
	UsagePercent float64
}

type MemStats struct {
	UsedPercent float64
}

type NetStats struct {
	DownloadBps float64
	UploadBps   float64
}

type cpuTicks struct {
	user   uint64
	system uint64
	idle   uint64
	nice   uint64
}

type netCounters struct {
	ibytes uint64
	obytes uint64
}

type collector struct {
	lastCPUTicks cpuTicks
	lastNet      netCounters
	lastTS       time.Time
	hasBaseline  bool
}

func (c *collector) sample() (CPUStats, MemStats, NetStats, error) {
	now := time.Now()

	currentCPU, err := readCPUTicks()
	if err != nil {
		return CPUStats{}, MemStats{}, NetStats{}, err
	}

	currentNet, err := readNetCounters()
	if err != nil {
		return CPUStats{}, MemStats{}, NetStats{}, err
	}

	mem, err := readMemory()
	if err != nil {
		return CPUStats{}, MemStats{}, NetStats{}, err
	}

	if !c.hasBaseline {
		c.lastCPUTicks = currentCPU
		c.lastNet = currentNet
		c.lastTS = now
		c.hasBaseline = true
		return CPUStats{}, mem, NetStats{}, nil
	}

	cpu := calculateCPUUsage(c.lastCPUTicks, currentCPU)
	net := calculateNetSpeed(c.lastNet, currentNet, now.Sub(c.lastTS))

	c.lastCPUTicks = currentCPU
	c.lastNet = currentNet
	c.lastTS = now

	return cpu, mem, net, nil
}

func readCPUTicks() (cpuTicks, error) {
	var info C.host_cpu_load_info_data_t
	kr := C.read_cpu_load(&info)
	if kr != C.KERN_SUCCESS {
		return cpuTicks{}, fmt.Errorf("host_statistics(HOST_CPU_LOAD_INFO) failed: %d", int(kr))
	}

	return cpuTicks{
		user:   uint64(info.cpu_ticks[C.CPU_STATE_USER]),
		system: uint64(info.cpu_ticks[C.CPU_STATE_SYSTEM]),
		idle:   uint64(info.cpu_ticks[C.CPU_STATE_IDLE]),
		nice:   uint64(info.cpu_ticks[C.CPU_STATE_NICE]),
	}, nil
}

func calculateCPUUsage(prev, current cpuTicks) CPUStats {
	userDelta := current.user - prev.user
	systemDelta := current.system - prev.system
	idleDelta := current.idle - prev.idle
	niceDelta := current.nice - prev.nice

	total := userDelta + systemDelta + idleDelta + niceDelta
	if total == 0 {
		return CPUStats{UsagePercent: 0}
	}

	busy := userDelta + systemDelta + niceDelta
	usage := (float64(busy) / float64(total)) * 100.0
	return CPUStats{UsagePercent: usage}
}

func readMemory() (MemStats, error) {
	var vmStats C.vm_statistics64_data_t
	kr := C.read_vm_stats(&vmStats)
	if kr != C.KERN_SUCCESS {
		return MemStats{}, fmt.Errorf("host_statistics64(HOST_VM_INFO64) failed: %d", int(kr))
	}

	var totalBytes C.uint64_t
	if ok := C.read_memsize(&totalBytes); !ok {
		return MemStats{}, errors.New("sysctlbyname(hw.memsize) failed")
	}

	var pageSize C.vm_size_t
	if ok := C.read_page_size(&pageSize); !ok {
		return MemStats{}, errors.New("host_page_size failed")
	}

	usedPages := uint64(vmStats.active_count + vmStats.inactive_count + vmStats.wire_count)
	usedBytes := float64(usedPages * uint64(pageSize))

	total := float64(uint64(totalBytes))
	if total <= 0 {
		return MemStats{UsedPercent: 0}, nil
	}

	return MemStats{UsedPercent: (usedBytes / total) * 100.0}, nil
}

func readNetCounters() (netCounters, error) {
	var head *C.struct_ifaddrs
	if rc := C.getifaddrs(&head); rc != 0 {
		return netCounters{}, errors.New("getifaddrs failed")
	}
	defer C.freeifaddrs(head)

	var inTotal uint64
	var outTotal uint64

	for ifa := head; ifa != nil; ifa = ifa.ifa_next {
		if ifa.ifa_data == nil {
			continue
		}

		if (ifa.ifa_flags & C.IFF_LOOPBACK) != 0 {
			continue
		}

		data := (*syscall.IfData)(unsafe.Pointer(ifa.ifa_data))
		inTotal += uint64(data.Ibytes)
		outTotal += uint64(data.Obytes)
	}

	return netCounters{ibytes: inTotal, obytes: outTotal}, nil
}

func calculateNetSpeed(prev, current netCounters, elapsed time.Duration) NetStats {
	sec := elapsed.Seconds()
	if sec <= 0 {
		return NetStats{}
	}

	inDelta := current.ibytes - prev.ibytes
	outDelta := current.obytes - prev.obytes

	return NetStats{
		DownloadBps: float64(inDelta) / sec,
		UploadBps:   float64(outDelta) / sec,
	}
}

func render(cpu CPUStats, mem MemStats, net NetStats) {
	fmt.Print("\033[H\033[2J")
	fmt.Println("mstat - macOS terminal system monitor")
	fmt.Println("Press Ctrl+C to exit")
	fmt.Println()

	fmt.Printf("CPU Usage:    %6.2f%% %s\n", cpu.UsagePercent, progressBar(cpu.UsagePercent, 30))
	fmt.Printf("Memory Usage: %6.2f%% %s\n", mem.UsedPercent, progressBar(mem.UsedPercent, 30))
	fmt.Println()
	fmt.Printf("Download: %s/s\n", formatBytes(net.DownloadBps))
	fmt.Printf("Upload:   %s/s\n", formatBytes(net.UploadBps))
}

func progressBar(percent float64, width int) string {
	if percent < 0 {
		percent = 0
	}
	if percent > 100 {
		percent = 100
	}

	filled := int(math.Round((percent / 100.0) * float64(width)))
	if filled < 0 {
		filled = 0
	}
	if filled > width {
		filled = width
	}

	empty := width - filled
	return fmt.Sprintf("[%s%s]", repeat("█", filled), repeat("░", empty))
}

func repeat(s string, n int) string {
	if n <= 0 {
		return ""
	}
	out := make([]byte, 0, len(s)*n)
	for i := 0; i < n; i++ {
		out = append(out, s...)
	}
	return string(out)
}

func formatBytes(v float64) string {
	const unit = 1024.0
	if v < unit {
		return fmt.Sprintf("%.0f B", v)
	}

	units := []string{"KB", "MB", "GB", "TB"}
	value := v
	for _, u := range units {
		value /= unit
		if value < unit {
			return fmt.Sprintf("%.2f %s", value, u)
		}
	}

	return fmt.Sprintf("%.2f PB", value/unit)
}

func main() {
	c := &collector{}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(sigCh)

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	if _, _, _, err := c.sample(); err != nil {
		fmt.Fprintf(os.Stderr, "initial sample failed: %v\n", err)
		os.Exit(1)
	}

	for {
		select {
		case <-sigCh:
			fmt.Println("\nExiting mstat")
			return
		case <-ticker.C:
			cpu, mem, net, err := c.sample()
			if err != nil {
				fmt.Fprintf(os.Stderr, "sample failed: %v\n", err)
				continue
			}
			render(cpu, mem, net)
		}
	}
}
