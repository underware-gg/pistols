// SPDX-License-Identifier: CC0
pragma solidity ^0.8.13;

library PistolsLib {
    uint256 constant ONE_TOKEN = 10 ** 18;
    uint256 constant MIN_STAKE = 25 * ONE_TOKEN;
    uint256 constant FULL_STEP_COUNT = 10;

    uint256 constant STATE_EMPTY = 0;
    uint256 constant STATE_CHALLENGE = 1;
    uint256 constant STATE_SHOOT_STEP_COMMITMENTS = 2;
    uint256 constant STATE_SHOOT_STEP_REVEALS = 3;
    uint256 constant STATE_SHOOT = 4;
    uint256 constant STATE_BATTLE_CHOICE_COMMITMENTS = 5;
    uint256 constant STATE_BATTLE_CHOICE_REVEALS = 6;
    uint256 constant STATE_BATTLE = 7;

    uint256 constant UNSET = type(uint256).max;

    uint256 constant BATTLE_CHOICE_LIGHT_HIT = 1;
    uint256 constant BATTLE_CHOICE_HEAVY_HIT = 2;
    uint256 constant BATTLE_CHOICE_BLOCK = 3;

    uint256 constant OUTCOME_DRAW = 0;
    uint256 constant OUTCOME_P1_WIN = 1;
    uint256 constant OUTCOME_P2_WIN = 2;
}
