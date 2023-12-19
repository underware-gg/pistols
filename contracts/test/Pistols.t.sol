// SPDX-License-Identifier: CC0
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {Pistols} from "../src/Pistols.sol";

contract PistolsTest is Test {
    Pistols public pistols;

    function setUp() public {
        pistols = new Pistols();
        pistols.setNumber(0);
    }

    function test_Increment() public {
        pistols.increment();
        assertEq(pistols.number(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        pistols.setNumber(x);
        assertEq(pistols.number(), x);
    }
}
