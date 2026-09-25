import historyData from "./history.json";
import { careerFor, currentSeasonFor, CURRENT_SEASON } from "./careerStats";
import { researchedSeason } from "./seasonStories";

export interface Season {
  year: number;
  entries: number;
  wins: number;
  podiums: number;
  races: { name: string; position: string; date: string }[];
}
export interface Driver {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  ferrariYears: string;
  era: string;
  number: string;
  tagline: string;
  summary: string;
  championshipsWithFerrari: number[];
  polesWithFerrari: number | null;
  importantCars: string[];
  importantRaces: string[];
  model: "classic" | "v10" | "modern";
  defaultYear: number;
  sources: { label: string; url: string }[];
}
export const eras = [
  "The pioneers",
  "A racing spirit",
  "A new ambition",
  "The Schumacher era",
  "The next chapter",
  "Modern Ferrari",
  "Present day",
];
const f1 = "https://www.formula1.com/en/results/";
const hero = (slug: string) => `https://www.ferrari.com/en-EN/formula1/${slug}`;
const base = (
  id: string,
  name: string,
  nationality: string,
  flag: string,
  years: string,
  era: number,
  number: string,
  tagline: string,
  summary: string,
  titles: number[],
  cars: string[],
  races: string[],
  year: number,
): Driver => ({
  id,
  name,
  nationality,
  flag,
  ferrariYears: years,
  era: eras[era],
  number,
  tagline,
  summary,
  championshipsWithFerrari: titles,
  polesWithFerrari: null,
  importantCars: cars,
  importantRaces: races,
  defaultYear: year,
  model: year < 1980 ? "classic" : year < 2010 ? "v10" : "modern",
  sources: [
    { label: `Formula 1 · ${year} results`, url: `${f1}${year}/races` },
  ],
});
export const drivers: Driver[] = [
  base(
    "ascari",
    "Alberto Ascari",
    "Italian",
    "IT",
    "1950–1954",
    0,
    "01",
    "The first dynasty.",
    "Ferrari’s first world champion helped define the Scuderia’s early years. His consecutive titles in 1952 and 1953 made the red cars the benchmark of a young world championship. He also made a Ferrari appearance at Monza in 1954.",
    [1952, 1953],
    ["500 F2"],
    ["1952 British Grand Prix"],
    1952,
  ),
  base(
    "fangio",
    "Juan Manuel Fangio",
    "Argentine",
    "AR",
    "1956",
    0,
    "02",
    "One season. One title.",
    "Fangio’s only season with Ferrari ended with a world championship. The shared-drive era made racing a different kind of team endeavour, and 1956 remains a distinctive chapter in his career.",
    [1956],
    ["D50"],
    ["1956 Italian Grand Prix"],
    1956,
  ),
  base(
    "hawthorn",
    "Mike Hawthorn",
    "British",
    "GB",
    "1953–1955 · 1957–1958",
    0,
    "03",
    "A champion in a bow tie.",
    "Hawthorn became Britain’s first Formula 1 world champion with Ferrari in 1958. Consistent results made the difference in a season remembered for both sporting achievement and profound loss.",
    [1958],
    ["246 F1"],
    ["1958 French Grand Prix"],
    1958,
  ),
  base(
    "phil_hill",
    "Phil Hill",
    "American",
    "US",
    "1958–1962",
    0,
    "04",
    "Quiet determination.",
    "Phil Hill reached the summit of Formula 1 with Ferrari in 1961. The distinctive 156, remembered for its shark-nose opening, became the machine associated with his championship.",
    [1961],
    ["156 F1"],
    ["1961 Italian Grand Prix"],
    1961,
  ),
  base(
    "surtees",
    "John Surtees",
    "British",
    "GB",
    "1963–1966",
    0,
    "05",
    "A champion on two wheels. And four.",
    "Already a motorcycle world champion, Surtees won the 1964 Formula 1 title with Ferrari. His mechanical understanding and versatility made his achievement unique in motorsport.",
    [1964],
    ["158 F1"],
    ["1964 Mexican Grand Prix"],
    1964,
  ),
  base(
    "lauda",
    "Niki Lauda",
    "Austrian",
    "AT",
    "1974–1977",
    1,
    "06",
    "The mind behind the speed.",
    "Precise feedback. Relentless development. Extraordinary resolve. Lauda helped return Ferrari to championship form, winning the drivers’ title in 1975 and again in 1977.",
    [1975, 1977],
    ["312 B3", "312 T", "312 T2"],
    [
      "1975 Monaco Grand Prix",
      "1976 Italian Grand Prix",
      "1977 Dutch Grand Prix",
    ],
    1975,
  ),
  base(
    "gilles_villeneuve",
    "Gilles Villeneuve",
    "Canadian",
    "CA",
    "1977–1982",
    1,
    "07",
    "Beyond the numbers.",
    "Villeneuve’s six Ferrari victories only begin to tell his story. His commitment at the wheel made him an enduring favourite, with the 1981 wins at Monaco and Spain central to his legacy.",
    [],
    ["312 T4", "126 CK"],
    ["1981 Monaco Grand Prix", "1981 Spanish Grand Prix"],
    1979,
  ),
  base(
    "scheckter",
    "Jody Scheckter",
    "South African",
    "ZA",
    "1979–1980",
    1,
    "08",
    "The art of a complete season.",
    "Scheckter won the 1979 drivers’ championship in his first season at Ferrari. Together with Gilles Villeneuve, he helped make the 312 T4 a championship-winning car.",
    [1979],
    ["312 T4"],
    ["1979 Italian Grand Prix"],
    1979,
  ),
  base(
    "mansell",
    "Nigel Mansell",
    "British",
    "GB",
    "1989–1990",
    2,
    "09",
    "Il Leone.",
    "Mansell began his Ferrari career with victory in Brazil in 1989. His aggressive racing and the innovative paddle-shift 640 made his brief time in red unforgettable.",
    [],
    ["640 F1", "641 F1"],
    ["1989 Brazilian Grand Prix", "1989 Hungarian Grand Prix"],
    1989,
  ),
  base(
    "prost",
    "Alain Prost",
    "French",
    "FR",
    "1990–1991",
    2,
    "10",
    "The pursuit of precision.",
    "Prost brought his measured, analytical approach to Ferrari. Five victories in 1990 took the championship contest into its decisive final stages.",
    [],
    ["641 F1", "643 F1"],
    ["1990 French Grand Prix"],
    1990,
  ),
  base(
    "michael_schumacher",
    "Michael Schumacher",
    "German",
    "DE",
    "1996–2006",
    3,
    "11",
    "An era. A legacy. A legend.",
    "Eleven seasons in red. A team rebuilt around a shared belief. From a rain-soaked breakthrough in Spain to five consecutive world titles, Schumacher and Ferrari created an extraordinary chapter in Formula 1.",
    [2000, 2001, 2002, 2003, 2004],
    ["F310", "F1-2000", "F2002", "F2004", "248 F1"],
    [
      "1996 Spanish Grand Prix",
      "2000 Japanese Grand Prix",
      "2004 Belgian Grand Prix",
      "2006 Chinese Grand Prix",
    ],
    2004,
  ),
  base(
    "raikkonen",
    "Kimi Räikkönen",
    "Finnish",
    "FI",
    "2007–2009 · 2014–2018",
    4,
    "12",
    "Let the driving speak.",
    "Räikkönen won the 2007 drivers’ championship in his first Ferrari season, taking the title at the final race in Brazil. A second spell brought a memorable victory in Austin in 2018.",
    [2007],
    ["F2007", "SF71H"],
    ["2007 Brazilian Grand Prix", "2018 United States Grand Prix"],
    2007,
  ),
  base(
    "alonso",
    "Fernando Alonso",
    "Spanish",
    "ES",
    "2010–2014",
    4,
    "13",
    "Every last tenth.",
    "Alonso won on his Ferrari debut in Bahrain. His five seasons included hard-fought championship challenges, with the 2010 and 2012 titles decided at the final race.",
    [],
    ["F10", "F2012", "F138"],
    ["2010 Bahrain Grand Prix", "2012 European Grand Prix"],
    2012,
  ),
  base(
    "vettel",
    "Sebastian Vettel",
    "German",
    "DE",
    "2015–2020",
    5,
    "14",
    "A racer. A romantic.",
    "Vettel arrived with an unmistakable affection for Ferrari’s history. His six seasons brought 14 wins, championship challenges and a place among the Scuderia’s most successful drivers.",
    [],
    ["SF15-T", "SF70H", "SF71H", "SF90"],
    [
      "2015 Malaysian Grand Prix",
      "2018 British Grand Prix",
      "2019 Singapore Grand Prix",
    ],
    2018,
  ),
  base(
    "sainz",
    "Carlos Sainz",
    "Spanish",
    "ES",
    "2021–2024",
    5,
    "15",
    "Built on belief.",
    "Sainz grew into a Grand Prix winner at Ferrari. Silverstone in 2022 brought his first victory, with Singapore in 2023 and Australia and Mexico in 2024 adding to his chapter.",
    [],
    ["F1-75", "SF-23", "SF-24"],
    ["2022 British Grand Prix", "2023 Singapore Grand Prix"],
    2023,
  ),
  base(
    "leclerc",
    "Charles Leclerc",
    "Monegasque",
    "MC",
    "2019–present",
    6,
    "16",
    "A dream written in red.",
    "A Ferrari Driver Academy graduate, Leclerc won at Spa and Monza in his first season with the team. His 2024 victory at home in Monaco added a deeply personal milestone.",
    [],
    ["SF90", "F1-75", "SF-24"],
    ["2019 Italian Grand Prix", "2024 Monaco Grand Prix"],
    2024,
  ),
  base(
    "hamilton",
    "Lewis Hamilton",
    "British",
    "GB",
    "2025–present",
    6,
    "17",
    "The next chapter begins.",
    "Hamilton joined Ferrari in 2025, beginning a new chapter alongside Charles Leclerc. His first Grand Prix victory in red came at the 2026 Barcelona Grand Prix. Sprint results are counted separately from Grand Prix results.",
    [],
    ["SF-25"],
    ["2025 Chinese Grand Prix weekend · sprint victory", "2026 Barcelona Grand Prix · first Ferrari Grand Prix win"],
    2025,
  ),
];
// Ferrari pole counts, researched and cross-checked in careerStats.json.
for (const driver of drivers)
  driver.polesWithFerrari = careerFor(driver.id).polesWithFerrari ?? null;
// Present-day bays open on the season in progress.
for (const driver of drivers)
  if (currentSeasonFor(driver.id)) driver.defaultYear = CURRENT_SEASON;
drivers[10].sources.push(
  { label: "Ferrari · Michael Schumacher", url: hero("michael-schumacher") },
  {
    label: "Ferrari · 58 pole positions",
    url: "https://www.ferrari.com/en-US/formula1/articles/hungarian-grand-prix-2020-preview",
  },
  {
    label: "Ferrari · The 2000 championship",
    url: "https://www.ferrari.com/en-EN/magazine/articles/2000-ferrari-world-drivers-constructors-championships",
  },
  {
    label: "Ferrari · The 2002 season",
    url: "https://www.ferrari.com/en-BJ/magazine/articles/michael-schumacher-2002-july-victory",
  },
  {
    label: "Ferrari · The 2004 season",
    url: "https://www.ferrari.com/en-UG/history/moments/2004/unstoppable/more",
  },
);
drivers[5].sources.push({
  label: "Ferrari · Lauda and the 312 T",
  url: "https://www.ferrari.com/en-CA/magazine/articles/ferrari-victories-the-1975-monaco-grand-prix",
});
drivers[13].sources.push({
  label: "Ferrari · Vettel’s six seasons",
  url: "https://www.ferrari.com/en-BE/formula1/articles/2020-abu-dhabi-grand-prix-preview",
});
drivers[0].sources.push({
  label: "Formula 1 · Ascari’s 1954 Ferrari appearance",
  url: "https://www.formula1.com/en/results/1954/drivers/ALBASC01/alberto-ascari",
});
drivers[16].sources.push({
  label: "Formula 1 · 2025 Chinese Sprint",
  url: "https://www.formula1.com/en/latest/article/hamilton-storms-to-sprint-victory-in-china-ahead-of-verstappen-and-piastri.2VzfSIOQeFC6y2Kskxkpz9",
});
const history = historyData as unknown as Record<
  string,
  { source: string; cutoff: string; seasons: Season[] }
>;
export function getHistory(id: string) {
  return (
    history[id] ?? {
      source: "https://api.jolpi.ca/ergast/f1/",
      cutoff: "2025-12-31",
      seasons: [],
    }
  );
}
export function getTotals(id: string) {
  return getHistory(id).seasons.reduce(
    (a, s) => ({
      entries: a.entries + s.entries,
      wins: a.wins + s.wins,
      podiums: a.podiums + s.podiums,
    }),
    { entries: 0, wins: 0, podiums: 0 },
  );
}
export const schumacherSeasons: Record<
  number,
  { car: string; title: string; story: string }
> = {
  1996: {
    car: "F310",
    title: "The beginning of belief.",
    story:
      "A first season of rebuilding. Three victories, beginning in the rain at Barcelona, offered a glimpse of what this partnership could become.",
  },
  1997: {
    car: "F310B",
    title: "A title within reach.",
    story:
      "Five wins brought Ferrari into the championship fight. The season ended in controversy at Jerez; Schumacher was excluded from the drivers’ championship classification.",
  },
  1998: {
    car: "F300",
    title: "The fight goes to the wire.",
    story:
      "Six victories kept the title challenge alive until the final race in Japan. The building blocks of Ferrari’s next era were falling into place.",
  },
  1999: {
    car: "F399",
    title: "A team moves forward.",
    story:
      "An injury at Silverstone interrupted Schumacher’s season. He returned in Malaysia as Ferrari pursued, and ultimately won, the constructors’ championship.",
  },
  2000: {
    car: "F1-2000",
    title: "Twenty-one years. One moment.",
    story:
      "Victory at Suzuka ended Ferrari’s 21-year wait for a drivers’ champion. Nine wins turned a long-held ambition into the first title of a remarkable sequence.",
  },
  2001: {
    car: "F2001",
    title: "The standard is set.",
    story:
      "Nine wins and a second consecutive Ferrari drivers’ title. A partnership built through difficult seasons had become the benchmark.",
  },
  2002: {
    car: "F2002",
    title: "Excellence, without interruption.",
    story:
      "A podium at every race. Eleven victories. Schumacher sealed the title in France in July, with six rounds of the championship still to run.",
  },
  2003: {
    car: "F2003-GA",
    title: "Earned at the final round.",
    story:
      "A closely fought season ended with a fourth consecutive Ferrari drivers’ title at Suzuka. Schumacher’s sixth career title surpassed Fangio’s total.",
  },
  2004: {
    car: "F2004",
    title: "The extraordinary becomes routine.",
    story:
      "Thirteen victories in eighteen races. A fifth consecutive drivers’ title in red. The F2004 season stands as a defining expression of this team’s extraordinary partnership.",
  },
  2005: {
    car: "F2005",
    title: "Even dynasties face resistance.",
    story:
      "A difficult season under new regulations brought one victory, at the six-car United States Grand Prix. Ferrari’s championship run came to an end.",
  },
  2006: {
    car: "248 F1",
    title: "One final charge in red.",
    story:
      "Seven victories brought one more title challenge. A final Ferrari win in China and a determined drive in Brazil closed eleven unforgettable seasons.",
  },
};
const ordinal = (n: number) =>
  n + (["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? "th");

export function seasonStory(driver: Driver, year: number) {
  if (driver.id === "michael_schumacher") return schumacherSeasons[year];
  const current = year === CURRENT_SEASON ? currentSeasonFor(driver.id) : undefined;
  if (current?.moments?.length)
    return {
      car: current.car?.replace(/^Ferrari\s+/, "") ?? "Season archive",
      title: current.wins?.length ? "A season in progress." : "The season so far.",
      // Lead with the season's victory, then the championship picture.
      story: [
        current.moments.find((m) => /^Won /.test(m)) ?? current.moments[0],
        current.championshipPosition
          ? `${ordinal(current.championshipPosition)} in the drivers' championship on ${current.championshipPoints} points after the race of ${new Date(`${current.positionAsOf}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  const editorial = extraSeasons[driver.id]?.[year];
  if (editorial) return editorial;
  const researched = researchedSeason(driver.id, year);
  if (researched) return researched;
  const s = getHistory(driver.id).seasons.find((x) => x.year === year);
  const champion = driver.championshipsWithFerrari.includes(year);
  const defaultCars: Record<string, string> = {
    alonso: "F2012",
    sainz: "SF-23",
    leclerc: "SF-24",
  };
  return {
    car:
      year === driver.defaultYear
        ? (defaultCars[driver.id] ?? driver.importantCars[0])
        : "Season archive",
    title: champion ? "A championship chapter." : `${year}. A season in red.`,
    story: `${driver.name} recorded ${s?.wins ?? 0} Grand Prix ${s?.wins === 1 ? "victory" : "victories"} and ${s?.podiums ?? 0} podium finishes for Ferrari in ${year}.${champion ? " The season ended with the drivers’ world championship." : ""} Open the race results below to explore the season.`,
  };
}
const extraSeasons: Record<
  string,
  Record<number, { car: string; title: string; story: string }>
> = {
  lauda: {
    1974: {
      car: "312 B3",
      title: "The work begins.",
      story:
        "Two victories in his first Ferrari season. Lauda’s precise, methodical approach helped establish the foundations for the championship challenge to come.",
    },
    1975: {
      car: "312 T",
      title: "The return to the summit.",
      story:
        "Victory in Monaco began a run of five wins. The 312 T and Lauda brought Ferrari its first drivers’ championship since 1964.",
    },
    1976: {
      car: "312 T2",
      title: "Resolve beyond racing.",
      story:
        "After his life-threatening Nürburgring accident, Lauda returned at Monza. His decision to withdraw from the wet finale in Japan remains central to this season’s story.",
    },
    1977: {
      car: "312 T2",
      title: "A second title in red.",
      story:
        "Three victories and consistent podium finishes delivered another drivers’ championship. Lauda’s final Ferrari season concluded a transformative partnership.",
    },
  },
  vettel: {
    2015: {
      car: "SF15-T",
      title: "A new beginning.",
      story:
        "Vettel’s first Ferrari victory came in Malaysia, in only his second race with the team. Wins in Hungary and Singapore followed.",
    },
    2016: {
      car: "SF16-H",
      title: "A season of persistence.",
      story:
        "Seven podium finishes kept Vettel at the front of the fight, but a second season with Ferrari passed without a Grand Prix victory.",
    },
    2017: {
      car: "SF70H",
      title: "Back in the title fight.",
      story:
        "Five victories put Vettel and Ferrari firmly into the championship contest. He ended the year runner-up in the drivers’ standings.",
    },
    2018: {
      car: "SF71H",
      title: "A season of possibility.",
      story:
        "Five victories included a win at Silverstone. Vettel finished the season second in the drivers’ championship, his second consecutive runner-up finish with Ferrari.",
    },
    2019: {
      car: "SF90",
      title: "One more night in Singapore.",
      story:
        "A Singapore victory became Vettel’s final Grand Prix win for Ferrari. Nine podium finishes marked his fifth season with the team.",
    },
    2020: {
      car: "SF1000",
      title: "Grazie, Seb.",
      story:
        "A third-place finish in Turkey provided a final Ferrari podium. Six seasons together ended in Abu Dhabi: 14 wins, 55 podiums and lasting affection.",
    },
  },
};
