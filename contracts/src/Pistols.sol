// SPDX-License-Identifier: CC0
pragma solidity ^0.8.13;

contract Pistols {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
