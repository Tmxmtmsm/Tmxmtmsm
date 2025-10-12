#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import random
import sys
import math
from typing import Optional, List


def input_ar(prompt: str) -> str:
    """Input wrapper with graceful EOF handling for Arabic prompts."""
    try:
        return input(prompt)
    except EOFError:
        print("\nتم الإنهاء.")
        sys.exit(0)


def guess_game(max_number: int = 100, max_attempts: Optional[int] = None, seed: Optional[int] = None) -> None:
    rng = random.Random(seed)
    secret_number = rng.randint(1, max_number)

    if max_attempts is None:
        # Slightly generous heuristic based on range size
        max_attempts = int(math.log2(max(2, max_number))) + 2

    print(f"خمن الرقم بين 1 و {max_number}. لديك {max_attempts} محاولات.")

    for attempt_index in range(1, max_attempts + 1):
        while True:
            user_text = input_ar(f"المحاولة {attempt_index}/{max_attempts} - أدخل رقمًا: ").strip()
            if not user_text:
                print("المدخل فارغ. حاول مرة أخرى.")
                continue
            if user_text.lower() in ("خروج", "انهاء", "إنهاء", "exit", "quit", "q"):
                print("تم الإنهاء.")
                return
            try:
                guess_value = int(user_text)
                break
            except ValueError:
                print("الرجاء إدخال رقم صحيح.")

        if guess_value < 1 or guess_value > max_number:
            print(f"الرقم خارج النطاق! (1..{max_number})")
            continue

        if guess_value == secret_number:
            print(f"أحسنت! لقد خمّنت الرقم {secret_number} بشكل صحيح.")
            return

        hint = "أكبر" if guess_value < secret_number else "أصغر"
        print(f"خطأ. حاول رقمًا {hint}.")

    print(f"انتهت المحاولات. الرقم الصحيح كان {secret_number}.")


def normalize_rps_choice(text: str) -> Optional[str]:
    normalized = text.strip().lower()
    mapping = {
        "حجر": "rock", "حجره": "rock", "صخر": "rock", "rock": "rock", "r": "rock",
        "ورقة": "paper", "ورقه": "paper", "ورق": "paper", "paper": "paper", "p": "paper",
        "مقص": "scissors", "scissors": "scissors", "s": "scissors",
    }
    return mapping.get(normalized)


def rps_round_result(user: str, comp: str) -> int:
    # returns 1 if user wins, 0 if draw, -1 if loss
    if user == comp:
        return 0
    winning_pairs = {("rock", "scissors"), ("scissors", "paper"), ("paper", "rock")}
    return 1 if (user, comp) in winning_pairs else -1


def rps_game(rounds: int = 3, seed: Optional[int] = None) -> None:
    rng = random.Random(seed)
    options = ["rock", "paper", "scissors"]
    user_score = 0
    comp_score = 0

    def ar_label(choice: str) -> str:
        return {"rock": "حجر", "paper": "ورقة", "scissors": "مقص"}[choice]

    print(f"لعبة حجر-ورقة-مقص. عدد الجولات: {rounds}. اكتب 'خروج' لإنهاء اللعب.")

    for round_index in range(1, rounds + 1):
        while True:
            choice_raw = input_ar(f"الجولة {round_index}/{rounds} - اختر (حجر/ورقة/مقص): ")
            if choice_raw.strip().lower() in ("خروج", "انهاء", "إنهاء", "exit", "quit", "q"):
                print("تم الإنهاء.")
                print(f"النتيجة النهائية — أنت: {user_score}، الكمبيوتر: {comp_score}")
                return
            user_choice = normalize_rps_choice(choice_raw)
            if user_choice is None:
                print("اختيار غير صالح. حاول مرة أخرى.")
                continue
            break

        comp_choice = rng.choice(options)
        result = rps_round_result(user_choice, comp_choice)

        print(f"أنت اخترت: {ar_label(user_choice)} | الكمبيوتر: {ar_label(comp_choice)}")
        if result == 1:
            print("فزت في هذه الجولة!")
            user_score += 1
        elif result == -1:
            print("خسرت هذه الجولة.")
            comp_score += 1
        else:
            print("تعادل.")
        print(f"النتيجة الحالية — أنت: {user_score}، الكمبيوتر: {comp_score}\n")

    print(f"النتيجة النهائية — أنت: {user_score}، الكمبيوتر: {comp_score}")


def interactive_menu() -> None:
    print("مرحبًا! هذه أداة ألعاب بسيطة.")
    while True:
        print("اختر لعبة:")
        print("1) خمن الرقم")
        print("2) حجر ورقة مقص")
        print("3) خروج")
        choice = input_ar("اختيارك: ").strip()
        if choice == "1":
            guess_game()
        elif choice == "2":
            rps_game()
        elif choice == "3" or choice.lower() in ("خروج", "exit", "quit", "q"):
            print("إلى اللقاء!")
            return
        else:
            print("اختيار غير صالح. حاول مرة أخرى.\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="game-tool",
        description="أداة ألعاب صغيرة بالواجهة العربية"
    )
    subparsers = parser.add_subparsers(dest="command")

    p_guess = subparsers.add_parser("guess", help="لعبة خمن الرقم")
    p_guess.add_argument("-n", "--max-number", type=int, default=100, help="أقصى رقم يمكن اختياره (افتراضي: 100)")
    p_guess.add_argument("-a", "--attempts", type=int, default=None, help="عدد المحاولات (افتراضي: ذكي)")
    p_guess.add_argument("--seed", type=int, default=None, help="بذرة التوليد العشوائي (اختياري)")

    p_rps = subparsers.add_parser("rps", help="لعبة حجر ورقة مقص")
    p_rps.add_argument("-r", "--rounds", type=int, default=3, help="عدد الجولات (افتراضي: 3)")
    p_rps.add_argument("--seed", type=int, default=None, help="بذرة التوليد العشوائي (اختياري)")

    subparsers.add_parser("menu", help="القائمة التفاعلية")

    return parser


def main(argv: Optional[List[str]] = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command is None or args.command == "menu":
        interactive_menu()
        return

    if args.command == "guess":
        guess_game(max_number=args.max_number, max_attempts=args.attempts, seed=args.seed)
        return

    if args.command == "rps":
        rps_game(rounds=args.rounds, seed=args.seed)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
