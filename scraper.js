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
  "driver,kart,tires,glider,weight,acceleration,on road traction,off road traction,mini-turbo,ground speed,water speed,anti-gravity speed,air speed,ground handling,water handling,anti-gravity handling,air handling,speed+MT,Pareto Optimal?";

// Generate all possible combinations of the four categories
var combinations = [];
for (const driver of drivers) {
  for (const body of bodies) {
    for (const tire of tires) {
      for (const glider of gliders) {
        const combinedData = [driver[0], body[0], tire[0], glider[0]];
        const sumData = driver.slice(1).map((value, index) => {
          const bodyValue = Number(body[index + 1]);
          const tireValue = Number(tire[index + 1]);
          const gliderValue = Number(glider[index + 1]);
          const sum = Number(value) + bodyValue + tireValue + gliderValue;
          return sum;
        });

        combinations.push([...combinedData, ...sumData]);
      }
    }
  }
}

for (const combo of combinations) {
  const speedIndex = header.split(",").indexOf("ground speed");
  const miniTurboIndex = header.split(",").indexOf("mini-turbo");

  // Add new columns to the combinations
  const speed = Number(combo[speedIndex]);
  const miniTurbo = Number(combo[miniTurboIndex]);
  const speedMiniTurbo = speed + miniTurbo;
  combo.push(speedMiniTurbo);

  // Add Pareto optimal column
  combo.push(
    combinations.every((otherCombo) => {
      const otherSpeed = Number(otherCombo[speedIndex]);
      const otherMiniTurbo = Number(otherCombo[miniTurboIndex]);
      if (speed == otherSpeed) {
        return miniTurbo >= otherMiniTurbo;
      } else if (miniTurbo == otherMiniTurbo) {
        return speed >= otherSpeed;
      } else {
        return true;
      }
    })
  );
}

// Print the header and combinations as a single string with line breaks
var output = [header, ...combinations.map((row) => row.join(","))].join("\n");
console.log(output);
