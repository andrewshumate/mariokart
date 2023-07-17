/**
 ** Source: https://chat.openai.com/share/6c6f6aa8-ab4e-4d52-bed8-3394f35ea3b0
 **
 ** To use this, copy-paste this entire file into the console on this page:
 ** https://www.mariowiki.com/Mario_Kart_8_Deluxe_in-game_statistics
 **
 ** The script will output a log message in CSV format which contains every
 ** Pareto optimal combo. Copy the log message (right click > "Copy Object")
 ** into a CSV file.
 **
 ** The pair of stats to consider (e.g. speed and mini-turbo) can be changed
 ** near the bottom of this file. Multiple Parteo optimality filters can be
 ** stacked on top of each other (order matters).
 **/

function extractTableData(table) {
  const rows = table.querySelectorAll("tr");
  const data = [];

  // Iterate over each row in the table
  for (const row of rows) {
    const rowData = [];
    const columns = row.querySelectorAll("td");

    // Ignore rows with incorrect number of columns
    if (columns.length !== 14) {
      continue;
    }

    const firstColumn = row.querySelectorAll("th a")[1];

    // Add the text content of the <a> tag to the beginning of the rowData array
    rowData.push(firstColumn ? firstColumn.textContent.trim() : "");

    // Iterate over each column in the row
    for (const column of columns) {
      rowData.push(column.textContent.trim());
    }

    data.push(rowData);
  }

  return data;
}

function deduplicateRows(tableData) {
  const mergedData = [];

  for (const row of tableData) {
    const firstColumnValue = row[0];
    const existingRow = mergedData.find((mergedRow) => {
      for (let i = 1; i < row.length; i++) {
        if (mergedRow[i] !== row[i]) {
          return false;
        }
      }
      return true;
    });

    if (existingRow) {
      // Merge the first column value when the remaining columns match
      existingRow[0] += `/${firstColumnValue}`;
    } else {
      mergedData.push(row);
    }
  }

  return mergedData;
}

function extractTablesData(tables) {
  const extractedData = {
    drivers: [],
    bodies: [],
    tires: [],
    gliders: [],
  };

  // Iterate over each table in the array
  for (const [index, table] of tables.entries()) {
    const tableData = extractTableData(table);

    // Ignore tables with no valid data
    if (tableData.length === 0) {
      continue;
    }

    const mergedTableData = deduplicateRows(tableData);

    // Determine the target variable based on the index
    let targetVariable;
    if (index === 0) {
      targetVariable = "drivers";
    } else if (index === 1) {
      targetVariable = "bodies";
    } else if (index === 2) {
      targetVariable = "tires";
    } else if (index === 3) {
      targetVariable = "gliders";
    }

    // Store the table data in the respective variable
    if (targetVariable) {
      extractedData[targetVariable] = mergedTableData;
    }
  }

  return extractedData;
}

var tables = document.querySelectorAll("table");
var extractedTablesData = extractTablesData(tables);
var { drivers, bodies, tires, gliders } = extractedTablesData;

// Generate all possible combinations of the four categories.
// Each combo represents a row in the output CSV.
var combinations = [];
for (const driver of drivers) {
  for (const body of bodies) {
    for (const tire of tires) {
      for (const glider of gliders) {
        const combo = [driver[0], body[0], tire[0], glider[0]];

        const comboStats = driver.slice(1).map((value, index) => {
          const bodyValue = Number(body[index + 1]);
          const tireValue = Number(tire[index + 1]);
          const gliderValue = Number(glider[index + 1]);
          const sum = Number(value) + bodyValue + tireValue + gliderValue;
          return sum;
        });

        combinations.push([...combo, ...comboStats]);
      }
    }
  }
}

// Create the header row
var Stat = {
  driver: "driver",
  kart: "kart",
  tires: "tires",
  glider: "glider",
  weight: "weight",
  acceleration: "acceleration",
  onRoadTraction: "on road traction",
  offRoadTraction: "off road traction",
  miniTurbo: "mini-turbo",
  groundSpeed: "ground speed",
  waterSpeed: "water speed",
  antiGravitySpeed: "anti-gravity speed",
  airSpeed: "air speed",
  groundHandling: "ground handling",
  waterHandling: "water handling",
  antiGravityHandling: "anti-gravity handling",
  airHandling: "air handling",
  invincibility: "invincibility",
};
var header = [
  Stat.driver,
  Stat.kart,
  Stat.tires,
  Stat.glider,
  Stat.weight,
  Stat.acceleration,
  Stat.onRoadTraction,
  Stat.offRoadTraction,
  Stat.miniTurbo,
  Stat.groundSpeed,
  Stat.waterSpeed,
  Stat.antiGravitySpeed,
  Stat.airSpeed,
  Stat.groundHandling,
  Stat.waterHandling,
  Stat.antiGravityHandling,
  Stat.airHandling,
  Stat.invincibility,
];

function removeParetoSuboptimalCombos(stat1, stat2) {
  header.push(`${stat1} + ${stat2}`);
  header.push("PO?");
  const stat1Index = header.indexOf(stat1);
  const stat2Index = header.indexOf(stat2);
  const paretoOptimalIndex = header.lastIndexOf("PO?");

  // Parteo optimal pass 1: Determine if there is "free stat1" on the table
  combinations.sort((a, b) => {
    const aStat1 = Number(a[stat1Index]);
    const bStat1 = Number(b[stat1Index]);
    if (aStat1 == bStat1) {
      const aStat2 = Number(a[stat2Index]);
      const bStat2 = Number(b[stat2Index]);
      return bStat2 - aStat2;
    } else {
      return bStat1 - aStat1;
    }
  });
  combinations.forEach((b, index) => {
    const bStat1 = Number(b[stat1Index]);
    const bStat2 = Number(b[stat2Index]);
    b.push(bStat1 + bStat2);

    if (index == 0) {
      b.push(true);
    } else {
      const a = combinations[index - 1];
      const aStat1 = Number(a[stat1Index]);
      const aStat2 = Number(a[stat2Index]);

      if (
        aStat1 == bStat1 &&
        (bStat2 < aStat2 || a[paretoOptimalIndex] == false)
      ) {
        b.push(false);
      } else {
        b.push(true);
      }
    }
  });

  // Pareto optimal pass 2: Determine if there is "free stat2" on the table
  // TODO reduce duplication
  combinations.sort((a, b) => {
    const aStat2 = Number(a[stat2Index]);
    const bStat2 = Number(b[stat2Index]);
    if (aStat2 == bStat2) {
      const aStat1 = Number(a[stat1Index]);
      const bStat1 = Number(b[stat1Index]);
      return bStat1 - aStat1;
    } else {
      return bStat2 - aStat2;
    }
  });
  combinations.forEach((b, index) => {
    if (index == 0) {
    } else {
      const a = combinations[index - 1];
      const aStat1 = Number(a[stat1Index]);
      const bStat1 = Number(b[stat1Index]);
      const aStat2 = Number(a[stat2Index]);
      const bStat2 = Number(b[stat2Index]);

      if (
        aStat2 == bStat2 &&
        (bStat1 < aStat1 || a[paretoOptimalIndex] == false)
      ) {
        b[paretoOptimalIndex] = false;
      }
    }
  });

  // Remove sub-optimal combos
  combinations = combinations.filter(
    (combo) => combo[paretoOptimalIndex] === true
  );
}

// Choose the pair(s) of stats to consider here. Multiple Parteo optimality
// filters can be stacked on top of each other (order matters).
removeParetoSuboptimalCombos(Stat.groundSpeed, Stat.miniTurbo);
removeParetoSuboptimalCombos(Stat.acceleration, Stat.invincibility);
removeParetoSuboptimalCombos(Stat.groundHandling, Stat.weight);

// Print the header and combinations as a single string with line breaks
var output = [header, ...combinations.map((row) => row.join(","))].join("\n");
console.log(output);
