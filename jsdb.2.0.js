
var metadata ={
    version:"2.0",
    time:"10-FEB-2024 10:28AM",
    json:localStorage.getItem("jsdb_tables")
}


class JSDB {
    constructor() {
    
    

        this.tables = this.loadTablesFromStorage();
        this.queryLogs = []; // Holds a log of queries executed
        this.outputLogs = []; // Holds a log of query results
    }

    loadTablesFromStorage() {
        const storedTables = localStorage.getItem("jsdb_tables");
        return storedTables ? JSON.parse(storedTables) : {};
      //  this.saveLogsAsTable("Requested to load data from database", "data loaded successfully. ")
    }


clearDatabase() {
    this.tables = {}; // Reset all tables
    this.saveTablesToStorage(); // Save empty state
    
    alert("All data has been deleted from the database.");
    saveLogs("clear database","Database cleared")
}
    saveTablesToStorage() {
        localStorage.setItem("jsdb_tables", JSON.stringify(this.tables));
       // this.saveLogsAsTable("requested save data in database ", "request processed successfully  ")
    }


importJSONNORMAL(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                this.tables = jsonData;
                this.saveTablesToStorage();
                alert("Database imported successfully!");
                this.saveLogsAsTable("database import requested", "database import successfully ")
            } catch (error) {
                alert("Invalid JSON file!");
                this.saveLogsAsTable("database import requested", "Invalid JSON file  ")
            }
        };
        reader.readAsText(file);
    }

 // Export database as JSON and download
    async exportDBJSON() {
    const password = prompt("Enter a strong password to encrypt the database:");
    if (!password) return alert("❌ Password is required!");

    const dbName = prompt("Enter a name for this database:");
    if (!dbName) return alert("❌ Database name is required!");
    
this.saveLogsAsTable("encryption requested", "encrypted database for exporting")

    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(64)); 
    const iv = crypto.getRandomValues(new Uint8Array(12));  // Fix: Use 12-byte IV for AES-GCM

    // Metadata
    const metadata = {
        databaseName: dbName,
        createdAt: new Date().toISOString(),
        version: "2.0.0",
        userId: "Confidential Database",
        tableCount: Object.keys(this.tables).length,
    };

    const jsonObject = { metadata, tables: this.tables };
    const jsonString = JSON.stringify(jsonObject);
    const encodedData = encoder.encode(jsonString);

    // Step 1: Generate Key with PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 500000,
            hash: "SHA-512"
        },
        keyMaterial,
        256 // Fix: Generate only 256-bit key
    );

    const encryptionKey = derivedBits.slice(0, 32); // Fix: AES-256 requires 32-byte key

    // Step 2: Encrypt Data with AES-256-GCM
    const aesKey = await crypto.subtle.importKey(
        "raw",
        encryptionKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encodedData
    );

    // Final Export Object
    const exportObject = {
        metadata,
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    };

    // Save as JSON file
    const blob = new Blob([JSON.stringify(exportObject)], { type: "application/json" });
    console.log(([JSON.stringify(exportObject)], { type: "application/json" }))
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${dbName}_secure_v2.json`;
    a.click();

    alert("✅ Highly secure database exported successfully!");
}
// Import JSON and restore database
    async importJSON(file) {
    const password = prompt("Enter the password to decrypt the database:");
    if (!password) return alert("❌ Password is required!");

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            const { metadata, salt, iv, encrypted } = importedData;

            const decoder = new TextDecoder();
            const encoder = new TextEncoder();

            // Convert Base64 to Uint8Array
            const saltArray = new Uint8Array([...atob(salt)].map(c => c.charCodeAt(0)));
            const ivArray = new Uint8Array([...atob(iv)].map(c => c.charCodeAt(0)));
            const encryptedArray = new Uint8Array([...atob(encrypted)].map(c => c.charCodeAt(0)));

            // Step 1: Derive Key using PBKDF2
            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                encoder.encode(password),
                { name: "PBKDF2" },
                false,
                ["deriveBits"]
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: "PBKDF2",
                    salt: saltArray,
                    iterations: 500000,
                    hash: "SHA-512"
                },
                keyMaterial,
                256 // Fix: Only generate a 256-bit key
            );

            const fullKey = derivedBits.slice(0, 32); // Fix: AES-256 requires 32-byte key

            // Step 2: Decrypt AES-256-GCM
            const aesKey = await crypto.subtle.importKey(
                "raw",
                fullKey,
                { name: "AES-GCM" },
                false,
                ["decrypt"]
            );

            const decryptedData = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivArray },
                aesKey,
                encryptedArray
            );

            const parsedData = JSON.parse(decoder.decode(decryptedData));

            alert(`✅ Imported database: ${metadata.databaseName}\n📅 Created: ${metadata.createdAt}\n📂 Tables: ${metadata.tableCount}`);

            this.tables = parsedData.tables;
            this.saveTablesToStorage();
this.saveLogsAsTable("decryption  requested", "decrypted database for importing")
            alert("✅ Database imported successfully!");
        } catch (error) {
            alert("❌ Incorrect password or corrupted file!");
            console.error(error);
        }
    };
    reader.readAsText(file);
}


    saveLogs(query, result) {
        this.queryLogs.push(query);
        this.outputLogs.push(result);
        var logsmain = document.getElementById("logs")
        var temp = document.createElement("p")
        logsmain.appendChild(temp)
        temp.innerHTML=`${query} \n ${result}\n ******`
    }

    normalizeQuery(query) {
        return query.replace(/\b(CREATE|TABLE|ADD|TO|DELETE|COL|FROM|SHOW|WHERE|REMOVE|UPDATE|ROW|IS|ORDER|BY|LIMIT|OFFSET|JOIN|ON|LIKE|IN|BETWEEN|GROUP|HAVING|COUNT|SUM|AVG|MIN|MAX)\b/gi, match => match.toLowerCase());
    }




    execute(query) {
        query = this.normalizeQuery(query).trim();
        const tokens = query.split(/\s+/);

        if (!tokens.length) return this.errorLog(query, "❌ Empty query!");

        let result;

        if (tokens[0] === "create" && tokens[1] === "table") {
            result = this.createTable(tokens);
        } else if (tokens[0] === "add" && tokens[1] === "to") {
            result = this.addToTable(tokens);
        } else if (tokens[0] === "delete" && tokens[1] === "col") {
            result = this.deleteColumn(tokens);
        }  else if (tokens[0] === "clear" && tokens[1] === "table") {
    result = this.clearTable(tokens);
}else if (tokens[0] === "remove" && tokens[1] === "from") {
            result = this.removeData(tokens);
        }else if (tokens[0] === "delete" && tokens[1] === "table") {
    result = this.deleteTable(tokens);
} else if (tokens[0] === "show") {
            result = this.advancedShowTable(tokens);
        } else if(tokens[0]=== "count"){
            result = this.countQuery(tokens)
        }else if(tokens[0]=== "order"){
            result = this.orderTable(tokens)
        }else if(tokens[0]=== "math"){
            result = this.mathOperation(tokens)
        }else if (tokens[0] === "update") {
            result = this.updateData(tokens);
        }else if (tokens[0] === "modify") {
        const tableName = tokens[1];

        if (!this.tables[tableName]) {
            const errorMsg = `❌ Table '${tableName}' does not exist!`;
            this.logQuery(query, errorMsg);
            return console.error(errorMsg);
        }

        if (tokens[2] === "add" && tokens[3] === "col") {
            return this.addColumns(tableName, tokens.slice(4).join(" "));
        } 
        else if (tokens[2] === "rename" && tokens[3] === "col") {
            return this.renameColumn(tableName, tokens[4], tokens[6]);
        } 
        else if (tokens[2] === "remove" && tokens[3] === "col") {
            return this.removeColumns(tableName, tokens.slice(4).join(" "));
        }
    } else {
        
            result = "❌ Invalid query syntax.";
        }

        this.saveLogs(query, result);
        return result;
    }

orderTable(tokens) {
    if (tokens.length < 6 || tokens[2].toUpperCase() !== "FROM" || tokens[4].toUpperCase() !== "BY") {
        return this.errorLog(tokens.join(" "), "❌ ORDER query format: ORDER column(s) FROM table BY column ASC/DESC");
    }

    const columnsToOrder = tokens[1] === "#" ? "ALL" : tokens[1].split(",").map(col => col.trim());
    const tableName = tokens[3];
    const orderByColumn = tokens[5];
    let orderDirection = "ASC";
    if (tokens.length > 6 && tokens[6].toUpperCase() === "DESC") orderDirection = "DESC";

    if (!this.tables[tableName]) return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);
    
    const table = this.tables[tableName];
    const orderByIdx = table.columns.indexOf(orderByColumn);
    if (orderByIdx === -1) return this.errorLog(tokens.join(" "), `❌ Column '${orderByColumn}' does not exist in '${tableName}'!`);
    
    // Determine which columns to order
    let columnIndices;
    if (columnsToOrder === "ALL") {
        columnIndices = table.columns.map((_, idx) => idx);
    } else {
        columnIndices = columnsToOrder.map(col => table.columns.indexOf(col));
        if (columnIndices.includes(-1)) return this.errorLog(tokens.join(" "), "❌ One or more specified columns do not exist!");
    }

    // Sort rows based on the orderByColumn but keep full row structure
    table.rows.sort((a, b) => {
        let valA = a[orderByIdx], valB = b[orderByIdx];

        if (!isNaN(valA) && !isNaN(valB)) {
            return orderDirection === "ASC" ? valA - valB : valB - valA;
        }
        return orderDirection === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    // Update table to reflect new order while keeping structure
    this.tables[tableName] = table;
    this.saveTablesToStorage(); // Save updated table

    return this.successLog(tokens.join(" "), `✅ Ordered '${tableName}' by '${orderByColumn}' in ${orderDirection} order.`);
}

mathOperation(tokens) {
    if (tokens.length < 5 || tokens[2].toUpperCase() !== "FROM") {
        return this.errorLog(tokens.join(" "), "❌ MATH query format: MATH column = expression FROM table [WHERE condition]");
    }

    const tableName = tokens[4];
    if (!this.tables[tableName]) return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);

    let operations = tokens.slice(1, tokens.indexOf("FROM")).join(" ").split(" AND ").map(op => op.trim());
    const whereIndex = tokens.indexOf("WHERE");
    let condition = null;
    
    if (whereIndex !== -1) {
        condition = tokens.slice(whereIndex + 1).join(" ");
    }

    const table = this.tables[tableName];

    operations.forEach(operation => {
        let [column, expression] = operation.split("=");
        column = column.trim();
        expression = expression.trim();
        
        let columnIdx = table.columns.indexOf(column);
        let isNewColumn = columnIdx === -1;

        if (isNewColumn) {
            table.columns.push(column);
            columnIdx = table.columns.length - 1;
            table.rows.forEach(row => row.push(null)); // Add new column to each row
        }

        table.rows.forEach((row, rowIndex) => {
            if (condition && !this.evaluateConditionMath(row, condition, table.columns)) return;

            let newValue = this.safeEvaluate(expression, row, table.columns);
            if (newValue !== "ERROR") {
                table.rows[rowIndex][columnIdx] = isNaN(newValue) ? newValue : parseFloat(newValue);
            }
        });
    });

    this.tables[tableName] = table;
    this.saveTablesToStorage();

    return this.successLog(tokens.join(" "), `✅ MATH operation applied to '${tableName}'.`);
}

safeEvaluate(expression, row, columns) {
    let modifiedExpression = expression;
    columns.forEach((col, index) => {
        modifiedExpression = modifiedExpression.replace(new RegExp(`\\b${col}\\b`, "g"), row[index]);
    });

    try {
        return Function(`"use strict"; return (${modifiedExpression})`)();
    } catch (err) {
        return "ERROR";
    }
}

evaluateConditionMath(row, condition, columns) {
    let modifiedCondition = condition;
    columns.forEach((col, index) => {
        modifiedCondition = modifiedCondition.replace(new RegExp(`\\b${col}\\b`, "g"), row[index]);
    });

    try {
        return Function(`"use strict"; return (${modifiedCondition})`)();
    } catch (err) {
        return false;
    }
}

    createTable(tokens) {
        const tableName = tokens[2];
        const columns = tokens.slice(3).join(" ").replace(/|/g, "").split(",").map(col => col.trim());

        if (!tableName || columns.length === 0) return this.errorLog(tokens.join(" "), "❌ Invalid table creation!");

        this.tables[tableName] = { columns, rows: [] };
        this.saveTablesToStorage();
        return this.successLog(tokens.join(" "), `✅ Table '${tableName}' created successfully!`);
    }

    addToTable(tokens) {
        const tableName = tokens[2];
        const values = tokens.slice(3).join(" ").replace(/|/g, "").split(",").map(val => val.trim());

        if (!this.tables[tableName]) return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);

        if (values.length !== this.tables[tableName].columns.length) return this.errorLog(tokens.join(" "), "❌ Column count does not match!");

        this.tables[tableName].rows.push(values);
        this.saveTablesToStorage();
        return this.successLog(tokens.join(" "), "✅ Row added successfully!");
    }

    deleteColumn(tokens) {
        const columnName = tokens[2];
        const tableName = tokens[4];

        if (!this.tables[tableName]) return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);

        const colIndex = this.tables[tableName].columns.indexOf(columnName);
        if (colIndex === -1) return this.errorLog(tokens.join(" "), `❌ Column '${columnName}' not found!`);

        this.tables[tableName].columns.splice(colIndex, 1);
        this.tables[tableName].rows = this.tables[tableName].rows.map(row => row.filter((_, i) => i !== colIndex));
        this.saveTablesToStorage();
        return this.successLog(tokens.join(" "), `✅ Column '${columnName}' deleted!`);
    }

// DELETE TABLE
deleteTable(tokens) {
    const tableName = tokens[2];

    if (!this.tables[tableName]) {
        const errorMessage = `❌ Table '${tableName}' does not exist!`;
        this.saveLogs(tokens.join(" "), errorMessage);
        return errorMessage;
    }

    delete this.tables[tableName]; // Remove table from storage
    this.saveTablesToStorage();
    
    const successMessage = `✅ Table '${tableName}' deleted successfully!`;
    this.saveLogs(tokens.join(" "), successMessage);
    return successMessage;
}

addColumns(tableName, columnList, query) {
    const columns = columnList.split(",").map(col => col.trim());
    let addedCols = [];

    columns.forEach(column => {
        if (!this.tables[tableName].columns.includes(column)) {
            this.tables[tableName].columns.push(column);
            this.tables[tableName].rows.forEach(row => row.push(null));
            addedCols.push(column);
        }
    });

    if (addedCols.length > 0) {
        this.saveTablesToStorage();
        return this.successLog(query, `✅ Added columns: ${addedCols.join(", ")} to '${tableName}'.`);
    } else {
        return this.errorLog(query, `⚠ No new columns added. Some may already exist.`);
    }
}

renameColumn(tableName, oldName, newName, query) {
    const colIndex = this.tables[tableName].columns.indexOf(oldName);
    
    if (colIndex === -1) {
        return this.errorLog(query, `❌ Column '${oldName}' not found in '${tableName}'!`);
    }

    this.tables[tableName].columns[colIndex] = newName;
    this.saveTablesToStorage();
    return this.successLog(query, `✅ Column '${oldName}' renamed to '${newName}' in '${tableName}'.`);
}

removeColumns(tableName, columnList, query) {
    const columns = columnList.split(",").map(col => col.trim());
    let removedCols = [];

    columns.forEach(column => {
        const colIndex = this.tables[tableName].columns.indexOf(column);
        if (colIndex !== -1) {
            this.tables[tableName].columns.splice(colIndex, 1);
            this.tables[tableName].rows.forEach(row => row.splice(colIndex, 1));
            removedCols.push(column);
        }
    });

    if (removedCols.length > 0) {
        this.saveTablesToStorage();
        return this.successLog(query, `✅ Removed columns: ${removedCols.join(", ")} from '${tableName}'.`);
    } else {
        return this.errorLog(query, `❌ No columns removed. They may not exist.`);
    }
}

// CLEAR TABLE (Removes all rows but keeps the columns)
clearTable(tokens) {
    const tableName = tokens[2];

    if (!this.tables[tableName]) {
        const errorMessage = `❌ Table '${tableName}' does not exist!`;
        this.saveLogs(tokens.join(" "), errorMessage);
        return errorMessage;
    }

    this.tables[tableName].rows = []; // Remove all data
    this.saveTablesToStorage();

    const successMessage = `✅ All data cleared from '${tableName}'!`;
    this.saveLogs(tokens.join(" "), successMessage);
    return successMessage;
}


countQuery(tokens) {
    const countType = tokens[1]; // "col" or "row"
    const tableName = tokens[3]; // Table name

    if (!this.tables[tableName]) {
        return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);
    }

    if (countType === "col") {
        // Count columns in the table
        const columnCount = this.tables[tableName].columns.length;
        return this.successLog(tokens.join(" "), `✅ ${columnCount} columns found in '${tableName}'.`);
    } else if (countType === "row") {
        let rows = [...this.tables[tableName].rows];

        // Check for conditions (WHERE clause)
        const whereIndex = tokens.indexOf("where");
        if (whereIndex !== -1) {
            const condition = tokens.slice(whereIndex + 1).join(" ");
            rows = rows.filter(row => this.evaluateCondition(condition, row, tableName));
        }

        return this.successLog(tokens.join(" "), `✅ ${rows.length} rows found in '${tableName}'.`);
    } else {
        return this.errorLog(tokens.join(" "), "❌ Invalid count type! Use 'col' or 'row'.");
    }
}

evaluateCondition(condition, row, tableName) {
    const [column, operator, value] = condition.split(" ");
    const columnIndex = this.tables[tableName].columns.indexOf(column);

    if (columnIndex === -1) return false; // Column not found

    const rowValue = row[columnIndex];
    const numericValue = isNaN(value) ? value : Number(value);

    switch (operator) {
        case "=": return rowValue == numericValue;
        case ">": return rowValue > numericValue;
        case "<": return rowValue < numericValue;
        default: return false;
    }
}

    advancedShowTable(tokens) {
    const tableName = tokens[tokens.indexOf("from") + 1];
    if (!this.tables[tableName]) {
        return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);
    }
    
    

    // Extract the requested columns
    const selectedColumns = tokens.slice(1, tokens.indexOf("from"));
    const allColumns = this.tables[tableName].columns;

    // If user inputs "show # from table", show all columns
    const columnsToShow = selectedColumns.length === 1 && selectedColumns[0] === "#"
        ? allColumns
        : selectedColumns.filter(col => allColumns.includes(col));

    if (columnsToShow.length === 0) {
        return this.errorLog(tokens.join(" "), `❌ No valid columns found in '${tableName}'!`);
    }

    // Extract query conditions after FROM
    const queryConditions = tokens.slice(tokens.indexOf(tableName) + 1).join(" ");

    // Apply conditions (if any)
    let rows = [...this.tables[tableName].rows];
    rows = this.applyConditions(rows, allColumns, queryConditions);

    // Filter the selected columns
    const filteredRows = rows.map(row =>
        columnsToShow.map(col => row[allColumns.indexOf(col)])
    );

    // Render results in a table format
    renderTable(columnsToShow, filteredRows);
    return this.successLog(tokens.join(" "), `✅ Showing ${columnsToShow.join(", ")} from '${tableName}'`);
}

applyConditions(rows, allColumns, conditions) {
    if (!conditions.includes("where")) return rows;

    const conditionPart = conditions.split("where")[1].trim();
    const [column, operator, value] = conditionPart.split(" ");

    if (!column || !operator || !value) return rows;

    const colIndex = allColumns.indexOf(column);
    if (colIndex === -1) return rows;

    return rows.filter(row => {
        const cellValue = row[colIndex];

        switch (operator) {
            case ">":
                return parseFloat(cellValue) > parseFloat(value);
            case "<":
                return parseFloat(cellValue) < parseFloat(value);
            case "=":
                return cellValue == value;
            case "like":
                return cellValue.toLowerCase().includes(value.toLowerCase().replace(/"/g, ""));
            default:
                return true;
        }
    });
}

    updateData(tokens) {
    const tableName = tokens[1];
    if (!this.tables[tableName]) {
        return this.errorLog(tokens.join(" "), `❌ Table '${tableName}' does not exist!`);
    }

    const setIndex = tokens.indexOf("set");
    const whereIndex = tokens.indexOf("where");

    if (setIndex === -1 || whereIndex === -1) {
        return this.errorLog(tokens.join(" "), `❌ Invalid UPDATE syntax!`);
    }

    // Extract column-value pair to update
    const setPart = tokens.slice(setIndex + 1, whereIndex).join(" ");
    const [updateColumn, updateValue] = setPart.split("=").map(e => e.trim());

    // Extract WHERE condition
    const wherePart = tokens.slice(whereIndex + 1).join(" ");
    const [whereColumn, whereValue] = wherePart.split("=").map(e => e.trim().replace(/"/g, ""));

    const allColumns = this.tables[tableName].columns;
    const colIndex = allColumns.indexOf(updateColumn);
    const whereColIndex = allColumns.indexOf(whereColumn);

    if (colIndex === -1 || whereColIndex === -1) {
        return this.errorLog(tokens.join(" "), `❌ Invalid column name!`);
    }

    // Update rows where condition matches
    let updatedCount = 0;
    this.tables[tableName].rows = this.tables[tableName].rows.map(row => {
        if (row[whereColIndex] == whereValue) {
            row[colIndex] = updateValue.replace(/"/g, ""); // Remove quotes for strings
            updatedCount++;
        }
        return row;
    });

    return this.successLog(tokens.join(" "), `✅ Updated ${updatedCount} row(s) in '${tableName}'.`);
}

    successLog(query, message) {
        this.saveLogs(query, message);
        this.saveLogsAsTable(query, message);
        return message;
    }

    errorLog(query, message) {
        this.saveLogs(query, message);
        this.saveLogsAsTable(query, message);
        return message;
    }
    
    saveLogsAsTable(query, response) {
    if (!this.tables['db_logs']) {
        this.tables['db_logs'] = { columns: ['timestamp', 'query', 'response'], rows: [] };
    }

    const logEntry = [
        new Date().toISOString(),  // Timestamp
        query,                     // Query
        response                    // Response (Result or Error)
    ];

    this.tables['db_logs'].rows.push(logEntry);
    this.saveTablesToStorage();
}
}
function renderTable(columns, rows) {
    new Tabulator("#table-container", {
        data: rows.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]]))),
        layout: "fitColumns",
        columns: columns.map(col => ({ title: col, field: col }))
    });
}

const jsdb = new JSDB();
function executeQuery() {
    const query = document.getElementById("queryInput").value;
    document.getElementById("queryInput").value = "";
    document.getElementById("output").textContent = jsdb.execute(query);
}


// Add export button to UI
/* const exportBtn = document.createElement("button");
exportBtn.textContent = "Export JSON";
exportBtn.onclick = () => db.exportJSON();
document.body.appendChild(exportBtn);

// Add Import Button & File Input
const importBtn = document.createElement("button");
importBtn.textContent = "Import JSON";
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "application/json";
fileInput.style.display = "none";

importBtn.onclick = () => fileInput.click();
fileInput.onchange = (event) => {
    if (event.target.files.length > 0) {
        db.importJSON(event.target.files[0]);
    }
};

document.body.appendChild(importBtn);
document.body.appendChild(fileInput);

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear Database";
clearBtn.onclick = () => db.clearDatabase();
document.body.appendChild(clearBtn);
 */
