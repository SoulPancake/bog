//go:build !darwin

package main

import "fmt"

func main() {
	fmt.Println("mstat is supported on macOS only.")
}
