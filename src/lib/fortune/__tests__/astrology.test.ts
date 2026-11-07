import { describe, expect, it } from "vitest";
import {
  calculateAge,
  getChineseNewYear,
  getChineseZodiac,
  getWesternSign,
  lifePathNumber,
  reduceNumber,
} from "../astrology";

describe("Western zodiac boundaries", () => {
  const cases: [number, number, string][] = [
    [1, 1, "capricorn"], [1, 19, "capricorn"], [1, 20, "aquarius"], [2, 18, "aquarius"],
    [2, 19, "pisces"], [3, 20, "pisces"], [3, 21, "aries"], [4, 19, "aries"], [4, 20, "taurus"],
    [5, 20, "taurus"], [5, 21, "gemini"], [6, 20, "gemini"], [6, 21, "cancer"], [7, 22, "cancer"],
    [7, 23, "leo"], [8, 22, "leo"], [8, 23, "virgo"], [9, 22, "virgo"], [9, 23, "libra"],
    [10, 22, "libra"], [10, 23, "scorpio"], [11, 21, "scorpio"], [11, 22, "sagittarius"],
    [12, 21, "sagittarius"], [12, 22, "capricorn"], [12, 31, "capricorn"],
  ];
  it.each(cases)("%i/%i → %s", (month, day, id) => {
    expect(getWesternSign({ month, day }).id).toBe(id);
  });
});

describe("Chinese New Year table", () => {
  // Published dates.
  const known: [number, string][] = [
    [1900, "1900-01-31"], [1950, "1950-02-17"], [1954, "1954-02-03"], [1985, "1985-02-20"], [1990, "1990-01-27"],
    [2000, "2000-02-05"], [2020, "2020-01-25"], [2023, "2023-01-22"], [2024, "2024-02-10"],
    [2025, "2025-01-29"], [2026, "2026-02-17"], [2027, "2027-02-06"], [2030, "2030-02-03"],
  ];
  it.each(known)("%i", (year, iso) => {
    const d = getChineseNewYear(year);
    expect(`${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`).toBe(iso);
  });
});

describe("Chinese zodiac respects Chinese New Year", () => {
  it("1990-01-26 is still Snake (1989), 1990-01-27 is Horse", () => {
    expect(getChineseZodiac({ year: 1990, month: 1, day: 26 })).toMatchObject({ id: "snake", lunarYear: 1989, bornBeforeChineseNewYear: true });
    expect(getChineseZodiac({ year: 1990, month: 1, day: 27 })).toMatchObject({ id: "horse", lunarYear: 1990, bornBeforeChineseNewYear: false });
  });
  it("2024-02-09 is Rabbit, 2024-02-10 is Dragon (Wood Dragon)", () => {
    expect(getChineseZodiac({ year: 2024, month: 2, day: 9 }).id).toBe("rabbit");
    expect(getChineseZodiac({ year: 2024, month: 2, day: 10 })).toMatchObject({ id: "dragon", elementEn: "Wood" });
  });
  it("2026-02-16 is Snake, 2026-02-17 is Fire Horse", () => {
    expect(getChineseZodiac({ year: 2026, month: 2, day: 16 }).id).toBe("snake");
    expect(getChineseZodiac({ year: 2026, month: 2, day: 17 })).toMatchObject({ id: "horse", elementEn: "Fire" });
  });
  it("2000 is Metal Dragon, 1984 is Wood Rat", () => {
    expect(getChineseZodiac({ year: 2000, month: 6, day: 1 })).toMatchObject({ id: "dragon", elementEn: "Metal" });
    expect(getChineseZodiac({ year: 1984, month: 6, day: 1 })).toMatchObject({ id: "rat", elementEn: "Wood" });
  });
  it("Thai year names", () => {
    expect(getChineseZodiac({ year: 2020, month: 6, day: 1 }).thaiYear).toBe("ปีชวด");
    expect(getChineseZodiac({ year: 2019, month: 6, day: 1 }).thaiYear).toBe("ปีกุน");
  });
});

describe("numerology", () => {
  it("reduces while keeping master numbers", () => {
    expect(reduceNumber(29)).toBe(11);
    expect(reduceNumber(1990)).toBe(1);
    expect(reduceNumber(38)).toBe(11);
    expect(reduceNumber(7)).toBe(7);
  });
  it("life path examples", () => {
    expect(lifePathNumber({ year: 1990, month: 11, day: 29 })).toBe(5); // 11 + 11 + 1 = 23 → 5
    expect(lifePathNumber({ year: 1985, month: 7, day: 15 })).toBe(9); // 6 + 7 + 5 (1985→23→5) = 18 → 9
    expect(lifePathNumber({ year: 1979, month: 11, day: 29 })).toBe(3); // 11 + 11 + 8 = 30 → 3
    expect(lifePathNumber({ year: 1987, month: 11, day: 4 })).toBe(22); // 4 + 11 + 7 = 22 (master)
  });
});

describe("age", () => {
  it("counts birthdays correctly", () => {
    const b = { year: 2000, month: 11, day: 8 };
    expect(calculateAge(b, { year: 2026, month: 11, day: 7 })).toBe(25);
    expect(calculateAge(b, { year: 2026, month: 11, day: 8 })).toBe(26);
  });
});
