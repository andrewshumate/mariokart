/**
 ** Source: https://chat.openai.com/share/6c6f6aa8-ab4e-4d52-bed8-3394f35ea3b0
 **
 ** To use this, copy-paste this entire file into the console on this page:
 ** https://www.mariowiki.com/Mario_Kart_8_Deluxe_in-game_statistics
 **
 ** Copy the log message (right click > "Copy Object") into a CSV file.
 **/

function extractTableData(table) {
  const rows = table.querySelectorAll("tr");
  const data = [];

  // Iterate over each row in the table
  for (const row of rows) {
    const rowData = [];
    const columns = row.querySelectorAll("td");

    // Ignore rows with incorrect number of columns
    if (columns.length !== 13) {
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

// Create the header row
var header =
  "driver,kart,tires,glider,weight,acceleration,on road traction,off road traction,mini-turbo,ground speed,water speed,anti-gravity speed,air speed,ground handling,water handling,anti-gravity handling,air handling,invincibility,speed+MT,Pareto Optimal?";

var speedIndex = header.split(",").indexOf("ground speed");
var miniTurboIndex = header.split(",").indexOf("mini-turbo");
var paretoOptimalIndex = header.split(",").indexOf("Pareto Optimal?");

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

        const speed = Number(comboStats[speedIndex - 4]);
        const miniTurbo = Number(comboStats[miniTurboIndex - 4]);
        const speedPlusMiniTurbo = speed + miniTurbo;

        combinations.push([...combo, ...comboStats, speedPlusMiniTurbo]);
      }
    }
  }
}

// Parteo optimal pass 1: Determine if there is "free speed" on the table
combinations.sort((a, b) => {
  const aSpeed = Number(a[speedIndex]);
  const bSpeed = Number(b[speedIndex]);
  if (aSpeed == bSpeed) {
    const aMiniturbo = Number(a[miniTurboIndex]);
    const bMiniturbo = Number(b[miniTurboIndex]);
    return bMiniturbo - aMiniturbo;
  } else {
    return bSpeed - aSpeed;
  }
});
combinations.forEach((b, index) => {
  if (index == 0) {
    b.push(true);
  } else {
    const a = combinations[index - 1];
    const aSpeed = Number(a[speedIndex]);
    const bSpeed = Number(b[speedIndex]);
    const aMiniturbo = Number(a[miniTurboIndex]);
    const bMiniturbo = Number(b[miniTurboIndex]);

    if (
      aSpeed == bSpeed &&
      (bMiniturbo < aMiniturbo || a[paretoOptimalIndex] == false)
    ) {
      b.push(false);
    } else {
      b.push(true);
    }
  }
});

// Pareto optimal pass 2: Determine if there is "free mini-turbo" on the table
// TODO reduce duplication
combinations.sort((a, b) => {
  const aMiniturbo = Number(a[miniTurboIndex]);
  const bMiniturbo = Number(b[miniTurboIndex]);
  if (aMiniturbo == bMiniturbo) {
    const aSpeed = Number(a[speedIndex]);
    const bSpeed = Number(b[speedIndex]);
    return bSpeed - aSpeed;
  } else {
    return bMiniturbo - aMiniturbo;
  }
});
combinations.forEach((b, index) => {
  if (index == 0) {
  } else {
    const a = combinations[index - 1];
    const aSpeed = Number(a[speedIndex]);
    const bSpeed = Number(b[speedIndex]);
    const aMiniturbo = Number(a[miniTurboIndex]);
    const bMiniturbo = Number(b[miniTurboIndex]);

    if (
      aMiniturbo == bMiniturbo &&
      (bSpeed < aSpeed || a[paretoOptimalIndex] == false)
    ) {
      b[paretoOptimalIndex] = false;
    }
  }
});

// Print the header and combinations as a single string with line breaks
var output = [header, ...combinations.map((row) => row.join(","))].join("\n");
console.log(output);
