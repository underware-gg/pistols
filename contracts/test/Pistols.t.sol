// SPDX-License-Identifier: CC0
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {ERC20Mock} from "openzeppelin-contracts/contracts/mocks/token/ERC20Mock.sol";
import {Pistols, Game, PlayerGameData, PlayerStats} from "../src/Pistols.sol";
import {PistolsLib as Lib} from "../src/PistolsLib.sol";

contract PistolsTest is Test {
    Pistols public pistols;
    ERC20Mock public lordsToken;

    address user1 = address(1);
    address user2 = address(2);

    uint256 constant public ONE_TOKEN = 10 ** 18;

    function setUp() public {
        lordsToken = new ERC20Mock();
        pistols = new Pistols(address(this), lordsToken, 5 minutes);
    }

    function test_happyPath() public {
        lordsToken.mint(user1, 1000 * ONE_TOKEN);
        lordsToken.mint(user2, 1000 * ONE_TOKEN);

        vm.prank(user1);
        lordsToken.approve(address(pistols), type(uint256).max);
        vm.prank(user1);
        uint256 gameId = pistols.challenge(25 * ONE_TOKEN, user2);

        vm.prank(user2);
        lordsToken.approve(address(pistols), type(uint256).max);
        vm.prank(user2);
        pistols.acceptChallenge(gameId);

        // Minimum fee of 25 tokens transferred to owner (==this)
        require(lordsToken.balanceOf(address(this)) == 25 * ONE_TOKEN);

        bytes32 p1ShootSalt = keccak256("p1 shoot salt");
        vm.prank(user1);
        pistols.commitShootStep(
            gameId,
            keccak256(abi.encodePacked(
                p1ShootSalt,
                Lib.FULL_STEP_COUNT
            ))
        );

        bytes32 p2ShootSalt = keccak256("p2 shoot salt");
        vm.prank(user2);
        pistols.commitShootStep(
            gameId,
            keccak256(abi.encodePacked(
                p2ShootSalt,
                Lib.FULL_STEP_COUNT
            ))
        );

        vm.prank(user1);
        pistols.revealShootStep(
            gameId,
            p1ShootSalt,
            Lib.FULL_STEP_COUNT
        );

        vm.prank(user2);
        pistols.revealShootStep(
            gameId,
            p2ShootSalt,
            Lib.FULL_STEP_COUNT
        );

        pistols.shootout(gameId);

        Game memory game = pistols.getGame(gameId);
        require(
            game.state == Lib.STATE_BATTLE_CHOICE_COMMITMENTS,
            "Expected STATE_BATTLE_CHOICE_COMMITMENTS"
        );

        bytes32 p1BattleChoiceSalt = keccak256("p1 battle choice salt");
        vm.prank(user1);
        pistols.commitBattleChoice(
            gameId,
            keccak256(abi.encodePacked(
                p1BattleChoiceSalt,
                Lib.BATTLE_CHOICE_HEAVY_HIT
            ))
        );

        bytes32 p2BattleChoiceSalt = keccak256("p2 battle choice salt");
        vm.prank(user2);
        pistols.commitBattleChoice(
            gameId,
            keccak256(abi.encodePacked(
                p2BattleChoiceSalt,
                Lib.BATTLE_CHOICE_HEAVY_HIT
            ))
        );

        vm.prank(user1);
        pistols.revealBattleChoice(
            gameId,
            p1BattleChoiceSalt,
            Lib.BATTLE_CHOICE_HEAVY_HIT
        );

        vm.prank(user2);
        pistols.revealBattleChoice(
            gameId,
            p2BattleChoiceSalt,
            Lib.BATTLE_CHOICE_HEAVY_HIT
        );

        pistols.battle(gameId);

        game = pistols.getGame(gameId);
        require(
            game.state == Lib.STATE_EMPTY,
            "Expected STATE_EMPTY"
        );

        // Both players died, so the pot was split
        // Both players are down 12.5 tokens due to the fee
        require(lordsToken.balanceOf(user1) == 987_500 * (ONE_TOKEN / 1000));
        require(lordsToken.balanceOf(user2) == 987_500 * (ONE_TOKEN / 1000));

        PlayerStats memory p1Stats = pistols.getPlayerStats(user1);
        PlayerStats memory p2Stats = pistols.getPlayerStats(user2);

        require(p1Stats.draws == 1);
        require(p1Stats.honor == 10);

        require(p2Stats.draws == 1);
        require(p2Stats.honor == 10);
    }
}
