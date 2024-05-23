const companySelect = document.getElementById("company-select");
const durationSelect = document.getElementById("duration-select");
const sortSelect = document.getElementById("sort-select");
const difficultyFilter = document.getElementById("difficulty-filter");
const currentSelection = document.getElementById("current-selection");

document.addEventListener("DOMContentLoaded", function () {
  fetch("company_data.json")
    .then((response) => response.json())
    .then((data) => initializeDropdowns(data))
    .catch((error) => console.error("Error loading company data:", error));
});

function initializeDropdowns(companyData) {
  Object.keys(companyData).forEach((company) => {
    const option = document.createElement("option");
    option.value = company;
    option.textContent = company.charAt(0).toUpperCase() + company.slice(1);
    companySelect.appendChild(option);
  });

  companySelect.addEventListener("change", function () {
    const selectedCompany = companySelect.value;
    const durations = companyData[selectedCompany];

    durationSelect.innerHTML = '<option value="">Select Duration</option>';
    durations.forEach((duration) => {
      const option = document.createElement("option");
      option.value = duration;
      option.textContent = formatDuration(duration);
      durationSelect.appendChild(option);
    });

    updateCompanyLogo(selectedCompany);
  });

  function updateDisplay() {
    const company = companySelect.value;
    const duration = durationSelect.value;
    const sort = sortSelect.value;
    const difficulty = difficultyFilter.value;

    const logoImg = document.getElementById("company-logo");
    const currentSelection = document.getElementById("current-selection");

    if (company && duration) {
      currentSelection.textContent = `${
        company.charAt(0).toUpperCase() + company.slice(1)
      } - ${formatDuration(duration)} Problems`;
      updateCompanyLogo(company);
      loadCompanyQuestions(company, duration, sort, difficulty);
    } else {
      logoImg.style.display = "none";
      currentSelection.textContent = "";
      clearTable();
    }
  }

  companySelect.addEventListener("change", updateDisplay);
  durationSelect.addEventListener("change", updateDisplay);
  sortSelect.addEventListener("change", updateDisplay);
  difficultyFilter.addEventListener("change", updateDisplay);
}

function updateCompanyLogo(companyName) {
  const logoImg = document.getElementById("company-logo");
  logoImg.src = `https://logo.clearbit.com/${companyName}.com`;
  logoImg.style.display = "block";
}

function loadCompanyQuestions(company, duration, sort, difficulty) {
  const csvFile = `data/LeetCode-Questions-CompanyWise/${company}_${duration}.csv`;
  fetch(csvFile)
    .then((response) => response.text())
    .then((csvText) => {
      displayTable(csvText, sort, difficulty);
    })
    .catch((error) => console.error("Failed to load data:", error));
}

function displayTable(csvData, sort, difficulty) {
  // Get the container for the table

  const tableContainer = document.getElementById("table-container");

  if (tableContainer.innerHTML == "") {
    if (window.problemsSolvedPerDayChart) {
      window.problemsSolvedPerDayChart.destroy();
    }
    if (window.problemsSolvedByHourChart) {
      window.problemsSolvedByHourChart.destroy();
    }
  }

  tableContainer.innerHTML = ""; // Clear previous content

  // Split CSV data into rows and filter out any empty rows
  let rows = csvData.split("\n").filter((row) => row.trim());
  console.log("Rows", rows);
  // Extract the header row
  const header = rows.shift();
  rows.unshift(header + ",Attempted,Date Solved");

  console.log("Header", header);
  // Sort rows if sort option is provided
  if (sort) {
    rows = sortRows(rows, sort, header);
  }

  // Filter rows by difficulty if the difficulty filter is applied
  if (difficulty) {
    rows = filterRows(rows, difficulty, header);
  }

  // Reinsert the header at the beginning of the rows array

  // Create a new table element
  const table = document.createElement("table");
  table.classList.add("styled-table"); // Apply custom table styles
  let checkboxCount = 0;  // Counter for the checkboxes
  // Iterate over each row to create table rows
  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    const cells = row.split(",");

    if (index > 0) {
      cells.push(""); // For 'Attempted' checkbox
      cells.push(""); // For 'Date Solved' input
    }

    cells.forEach((cell, cellIndex) => {
      const cellElement = document.createElement(index === 0 ? "th" : "td");
      cellElement.classList.add("border", "px-4", "py-2", "text-center"); // Apply Tailwind CSS classes

      if (index === 0) {
        cellElement.style.backgroundColor = "#009879"; // Header cells background color
        cellElement.style.color = "white";
      }

      if (index === 0 && cellIndex === cells.length - 2) {
        // Set text for 'Attempted' header
        cellElement.textContent = "Attempted";
      } else if (index === 0 && cellIndex === cells.length - 1) {
        // Set text for 'Attempted' header
        cellElement.textContent = "Date Solved";
      } else if (index > 0 && cellIndex === cells.length - 2) {
        // Checkbox for 'Attempted'
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("form-checkbox", "h-5", "w-5", "text-blue-600");
        checkbox.id = `attempt-${cells[0]}`;
        checkbox.checked = JSON.parse(
          localStorage.getItem(checkbox.id) || "false"
        );

        if(checkbox.checked){
          checkboxCount++;
        }

        checkbox.addEventListener("change", function () {
          const dateInput = document.getElementById(`date-${cells[0]}`);
          if (this.checked) {
            const currentDate = formatDate(new Date());
            dateInput.value = currentDate;
            localStorage.setItem(`date-${cells[0]}`, currentDate);
          } else {
            dateInput.value = "";
            localStorage.removeItem(`date-${cells[0]}`);
          }
          localStorage.setItem(this.id, this.checked);
        });

        const label = document.createElement("label");
        label.classList.add("inline-flex", "justify-center", "items-center");
        label.appendChild(checkbox);
        cellElement.appendChild(label);
      } else if (index > 0 && cellIndex === cells.length - 1) {
        // Input for 'Date Solved'
        const dateInput = document.createElement("input");
        dateInput.type = "text";
        dateInput.id = `date-${cells[0]}`;
        dateInput.classList.add("form-input", "text-center");
        dateInput.value = localStorage.getItem(`date-${cells[0]}`) || "";
        dateInput.disabled = !JSON.parse(
          localStorage.getItem(`attempt-${cells[0]}`) || "false"
        );

        dateInput.addEventListener("change", function () {
          localStorage.setItem(this.id, this.value);
        });

        cellElement.appendChild(dateInput);
      } else if (index > 0 && cellIndex === 5) {
        // Handling link cells
        cellElement.style.display = "flex";
        cellElement.style.flexDirection = "row-reverse";
        cellElement.style.justifyContent = "space-around";
        const link = document.createElement("a");
        link.href = cell;
        link.target = "_blank";
        const leetCodeIcon = new Image();
        leetCodeIcon.src = "leetcode.svg";
        leetCodeIcon.alt = "LeetCode";
        leetCodeIcon.style.alignItems = "center";
        leetCodeIcon.style.height = "30px";
        leetCodeIcon.style.width = "30px";
        link.appendChild(leetCodeIcon);
        cellElement.appendChild(link);
      } else if (cellIndex === 3) {
        // Special formatting for the Difficulty column
        const difficultyTag = document.createElement("span");
        difficultyTag.classList.add("difficulty-tag");

        if (cell === "Easy") {
          difficultyTag.classList.add("difficulty-easy");
        } else if (cell === "Medium") {
          difficultyTag.classList.add("difficulty-medium");
        } else if (cell === "Hard") {
          difficultyTag.classList.add("difficulty-hard");
        }
        difficultyTag.textContent = cell;
        cellElement.appendChild(difficultyTag);
      } else if (index > 0 && cellIndex === 4) {
        // Formatting for frequency cells
        cellElement.textContent = `${parseFloat(cell).toFixed(2)}%`;
      } else {
        // Normal cell handling
        cellElement.textContent = cell;
      }

      tr.appendChild(cellElement);
    });

    table.appendChild(tr);
  });

  // Create a div to display the number of questions
  // Create a style element
  const style = document.createElement("style");
  // Add style rules to the style element
  style.textContent = `
  .row-count-display {
    padding: 10px 20px;
    margin-top: 20px;
    background-color: #025464;
    border-radius: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
    font-size: 18px;
    text-align: center;
    color: #ffffff;
    width: 40%;
  }
`;
  // Append the style tag to the head of the document
  document.head.appendChild(style);

  // Create a div to display the number of questions
  const rowCountDisplay = document.createElement("div");
  rowCountDisplay.className = "row-count-display"; // Assign the class to the div
  rowCountDisplay.textContent = `📊 Ratio of Answered to Total Questions: ${checkboxCount} / ${rows.length - 1}`;
  // Insert the row count above the table
  tableContainer.insertBefore(rowCountDisplay, tableContainer.firstChild);
  tableContainer.appendChild(table);
}

function formatDate(date) {
  const nth = (d) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  let day = date.getDate();
  let month = date.toLocaleString("default", { month: "long" });
  let year = date.getFullYear();
  let hour = date.getHours() % 12 || 12; // Convert to 12 hour format
  let minute = date.getMinutes().toString().padStart(2, "0");
  let ampm = date.getHours() >= 12 ? "PM" : "AM";

  return `${day}${nth(day)} ${month} ${year}, ${hour}:${minute} ${ampm}`;
}

function sortRows(rows, sort, header) {
  const headerParts = header.split(",");
  const sortKey = sort.split("-")[0].trim();
  // Adjust the sort key to match the header case
  const capitalizedSortKey =
    sortKey.charAt(0).toUpperCase() + sortKey.slice(1).toLowerCase();
  const columnIndex = headerParts.indexOf(capitalizedSortKey);

  if (columnIndex === -1) {
    console.error("Sort key not found in header:", capitalizedSortKey);
    return rows; // Return unsorted rows to prevent further errors
  }

  const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
  const isAscending = sort.includes("asc"); // Determine sorting order

  rows.sort((a, b) => {
    let rowA = a.split(",");
    let rowB = b.split(",");
    let valA = rowA[columnIndex];
    let valB = rowB[columnIndex];

    if (valA === undefined || valB === undefined) {
      console.error(
        "Undefined value found for sort key",
        capitalizedSortKey,
        "at index",
        columnIndex
      );
      return 0;
    }

    valA = valA.trim();
    valB = valB.trim();

    if (capitalizedSortKey === "Frequency") {
      valA = parseFloat(valA);
      valB = parseFloat(valB);
    } else if (capitalizedSortKey === "Difficulty") {
      valA = difficultyOrder[valA];
      valB = difficultyOrder[valB];
    }

    if (valA < valB) {
      return isAscending ? -1 : 1; // Adjust return based on sorting order
    } else if (valA > valB) {
      return isAscending ? 1 : -1; // Adjust return based on sorting order
    }
    return 0;
  });
  return rows;
}

function filterRows(rows, difficulty, header) {
  const headerParts = header.split(",");
  const columnIndex = headerParts.indexOf("Difficulty");
  return rows.filter(
    (row) => row.split(",")[columnIndex].trim() === difficulty
  );
}

function formatDuration(duration) {
  return duration
    .replace("months", " Months")
    .replace("year", " Year")
    .replace("alltime", "All Time");
}

document.getElementById("search-button").addEventListener("click", () => {
  const id = document.getElementById("id-search").value.trim();
  if (id) {
    searchByID(id);
  }
});

// Event listener to handle "Enter" key in the input field
document.getElementById("id-search").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent the default action to avoid submitting the form
    const id = document.getElementById("id-search").value.trim();
    if (id) {
      searchByID(id);
    }
  }
});

function searchByID(id) {
  fetch("company_data.json")
    .then((response) => response.json())
    .then((data) => {
      const tableData = {};
      let foundTitle = "";
      let foundLink = "";
      Object.entries(data).forEach(([company, durations]) => {
        let hasID = false;
        const frequencyMap = {}; // Map to store total frequency for each duration
        durations.forEach((duration) => {
          const csvFile = `data/LeetCode-Questions-CompanyWise/${company}_${duration}.csv`;
          fetch(csvFile)
            .then((response) => response.text())
            .then((csvText) => {
              const rows = csvText.split("\n").filter((row) => row.trim());
              const header = rows.shift().split(",");
              const idIndex = header.findIndex((col) => col.trim() === "ID");
              const titleIndex = header.findIndex(
                (col) => col.trim() === "Title"
              );
              const linkIndex = header.findIndex(
                (col) => col.trim() === "Leetcode Question Link"
              );
              const frequencyIndex = header.findIndex(
                (col) => col.trim() === "Frequency"
              );
              rows.forEach((row) => {
                const cells = row.split(",");
                if (cells[idIndex].trim() === id) {
                  hasID = true;
                  foundTitle = cells[titleIndex].trim();
                  foundLink = cells[linkIndex].trim();
                  const frequency = parseFloat(cells[frequencyIndex].trim());
                  frequencyMap[duration] = frequencyMap[duration]
                    ? frequencyMap[duration] + frequency
                    : frequency;
                }
              });
              if (hasID) {
                const totalFrequency = Object.values(frequencyMap).reduce(
                  (acc, val) => acc + val,
                  0
                );
                if (totalFrequency > 0) {
                  tableData[company] = tableData[company] || {};
                  Object.entries(frequencyMap).forEach(
                    ([duration, frequency]) => {
                      tableData[company][duration] = frequency.toFixed(2);
                    }
                  );
                }
                displaySearchResults(tableData, foundTitle, foundLink);
              }
            })
            .catch((error) => console.error("Failed to load data:", error));
        });
      });
    })
    .catch((error) => console.error("Error loading company data:", error));
}

function displaySearchResults(data, title, link) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  // Create a container for title and link to display them inline
  const titleLinkContainer = document.createElement("div");
  titleLinkContainer.style.display = "flex";
  titleLinkContainer.style.alignItems = "center";
  titleLinkContainer.style.justifyContent = "center";
  titleLinkContainer.style.marginBottom = "10px";

  const titleElement = document.createElement("h2");
  titleElement.textContent = title;
  titleElement.style.fontSize = "30px";
  titleElement.style.marginRight = "10px";

  // Create checkbox beside the title
  const titleCheckbox = document.createElement("input");
  titleCheckbox.type = "checkbox";
  titleCheckbox.id = "title-checkbox"; // Specific ID for the checkbox
  titleCheckbox.classList.add(
    "form-checkbox",
    "h-5",
    "w-5",
    "text-blue-600",
    "mr-2"
  ); // Tailwind CSS for style

  const checkboxId = document.getElementById("id-search").value; // Ensure this element exists and has a value

  function getLocalStorageItem(key, checkboxId, defaultValue = "false") {
    return JSON.parse(
      localStorage.getItem(`${key}-${checkboxId}`) || defaultValue
    );
  }

  titleCheckbox.checked =
    getLocalStorageItem("attempt", checkboxId) ||
    getLocalStorageItem("date", checkboxId);

  // Event listener to update local storage or handle changes
  titleCheckbox.addEventListener("change", function () {
    localStorage.setItem(`attempt-${checkboxId}`, this.checked);
    const currentDate = formatDate(new Date());
    localStorage.setItem(`date-${checkboxId}`, currentDate);
  });

  // Append the checkbox to the container

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", link);
  linkElement.style.display = "inline-flex";
  linkElement.style.alignItems = "center";
  linkElement.style.textDecoration = "none";

  const leetCodeIcon = new Image();
  leetCodeIcon.src = "leetcode.svg"; // Ensure this path correctly points to the LeetCode logo
  leetCodeIcon.alt = "LeetCode";
  leetCodeIcon.style.height = "34px"; // Icon height
  leetCodeIcon.style.width = "34px"; // Icon width
  leetCodeIcon.style.marginRight = "5px"; // Space between the icon and the text
  leetCodeIcon.style.backgroundColor = "white"; // Set the background color to white
  leetCodeIcon.style.borderRadius = "50%"; // Make the background circular
  leetCodeIcon.style.padding = "5px"; // Add padding to expand the background area
  leetCodeIcon.style.display = "flex"; // Ensures the icon centers correctly in its expanded background
  leetCodeIcon.style.justifyContent = "center"; // Center the icon horizontally within its padding
  leetCodeIcon.style.alignItems = "center"; // Center the icon vertically within its padding
  leetCodeIcon.style.boxSizing = "border-box"; // Includes padding in the width and height measurements

  linkElement.insertBefore(leetCodeIcon, linkElement.firstChild);

  titleLinkContainer.appendChild(titleCheckbox);
  titleLinkContainer.appendChild(titleElement);
  titleLinkContainer.appendChild(linkElement);
  tableContainer.appendChild(titleLinkContainer);

  if (Object.keys(data).length === 0) {
    const noDataMsg = document.createElement("p");
    noDataMsg.textContent = "The question was not asked in any company.";
    noDataMsg.style.textAlign = "center";
    noDataMsg.style.fontSize = "20px";
    tableContainer.appendChild(noDataMsg);
  } else {
    const companyCount = document.createElement("p");
    companyCount.textContent = `Number of companies: ${
      Object.keys(data).length
    }`;
    companyCount.style.textAlign = "center";
    companyCount.style.fontSize = "20px";
    tableContainer.appendChild(companyCount);

    const table = document.createElement("table");
    table.classList.add("styled-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const companyNameHeader = document.createElement("th");
    companyNameHeader.style.backgroundColor = "#556FB5";
    companyNameHeader.style.color = "white";
    companyNameHeader.textContent = "Company";
    const frequencyHeader = document.createElement("th");
    frequencyHeader.textContent = "Frequency";
    frequencyHeader.style.backgroundColor = "#556FB5";
    frequencyHeader.style.color = "white";
    headerRow.appendChild(companyNameHeader);
    headerRow.appendChild(frequencyHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    Object.entries(data).forEach(([company, durations]) => {
      const row = document.createElement("tr");

      const companyNameCell = document.createElement("td");
      companyNameCell.style.display = "flex";
      companyNameCell.style.alignItems = "center";
      const companyLogo = document.createElement("img");
      companyLogo.src = `https://logo.clearbit.com/${company}.com`;
      companyLogo.style.height = "24px";
      companyNameCell.appendChild(companyLogo);
      companyNameCell.appendChild(
        document.createTextNode(
          company[0].toUpperCase() + company.slice(1).toLowerCase()
        )
      );
      row.appendChild(companyNameCell);

      const frequencyCell = document.createElement("td");
      Object.entries(durations).forEach(([duration, frequency]) => {
        const tag = document.createElement("span");
        tag.textContent = `${Math.ceil(frequency * 100)}% (${duration})`;
        tag.classList.add("frequency-tag");
        tag.style.marginRight = "10px";
        if (parseFloat(frequency) >= 0.7) {
          tag.classList.add("high-frequency");
        } else if (parseFloat(frequency) >= 0.4) {
          tag.classList.add("medium-frequency");
        } else {
          tag.classList.add("low-frequency");
        }
        frequencyCell.appendChild(tag);
      });
      row.appendChild(frequencyCell);

      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }
}

function clearUIElements() {
  // Clear the table
  document.getElementById("table-container").innerHTML = "";
  document.getElementById("current-selection").innerText = "";
  document.getElementById("company-logo").style.display = "none";
  document.getElementById("id-search").value = "";
  document.getElementById("options").style.display = "none"; // Show the dropdown

  document.getElementById('newEntryForm').classList.add('hidden');
  document.getElementById('summaryTable').classList.add('hidden');
  document.getElementById('uniqueId').value = '';

  if (window.problemsSolvedPerDayChart) {
    window.problemsSolvedPerDayChart.destroy();
  }
  if (window.problemsSolvedByHourChart) {
    window.problemsSolvedByHourChart.destroy();
  }

  document.getElementById("company-select").selectedIndex = 0;
  document.getElementById("duration-select").selectedIndex = 0;
  document.getElementById("sort-select").selectedIndex = 0;
  document.getElementById("difficulty-filter").selectedIndex = 0;
}

// Add the event listener to the clear button
document.getElementById("clear-button").addEventListener("click", clearUIElements);

function clearTable() {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";
}

document.getElementById("analysisBtn").addEventListener("click", function () {
  document.getElementById("options").style.display = "block";
  updateCharts();
});

document.getElementById("timeFrame").addEventListener("change", function () {
  updateCharts();
});

function updateCharts() {
  const problemsSolvedPerDayCtx = document
    .getElementById("problemsSolvedPerDay")
    .getContext("2d");
  const problemsSolvedByHourCtx = document
    .getElementById("problemsSolvedByHour")
    .getContext("2d");
  const selectedTimeFrame = document.getElementById("timeFrame").value;

  if (window.problemsSolvedPerDayChart) {
    window.problemsSolvedPerDayChart.destroy();
  }
  if (window.problemsSolvedByHourChart) {
    window.problemsSolvedByHourChart.destroy();
  }

  const solvedData = {};
  const timeData = Array(24).fill(0);
  const now = new Date();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("date-")) {
      const value = localStorage.getItem(key);
      if (value) {
        const date = parseDate(value);
        const dayKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const hour = date.getHours();

        if (selectedTimeFrame === "month-wise") {
          solvedData[monthKey] = (solvedData[monthKey] || 0) + 1;
        } else {
          if (
            (selectedTimeFrame === "week" && isLast7Days(date, now)) ||
            (selectedTimeFrame === "month" && isLastMonth(date, now))
          ) {
            solvedData[dayKey] = (solvedData[dayKey] || 0) + 1;
          }
        }

        timeData[hour]++;
      }
    }
  }

  // Handle missing data for month-wise and time frames
  let labels, data;
  if (selectedTimeFrame === "month-wise") {
    const year = new Date().getFullYear();
    labels = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
    data = labels.map((date) => ({
      x: date,
      y: solvedData[`${date.getFullYear()}-${date.getMonth() + 1}`] || 0,
    }));
  } else {
    const startDate =
      selectedTimeFrame === "week"
        ? new Date(now.setDate(now.getDate() - 7))
        : new Date(now.setMonth(now.getMonth() - 1));
    const endDate = new Date();
    labels = [];
    for (
      let dt = new Date(startDate);
      dt <= endDate;
      dt.setDate(dt.getDate() + 1)
    ) {
      labels.push(new Date(dt));
    }
    data = labels.map((date) => ({
      x: date,
      y:
        solvedData[
          `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        ] || 0,
    }));
  }

  window.problemsSolvedPerDayChart = new Chart(problemsSolvedPerDayCtx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Problems Solved",
          data: data,
          fill: true,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: selectedTimeFrame === "month-wise" ? "month" : "day",
            tooltipFormat: "do MMM yyyy",
            displayFormats: {
              day: "do MMM yyyy",
              month: "MMM yyyy",
            },
          },
          ticks: {
            color: "rgb(255, 253, 208)", // Cream color for X-axis ticks
          },
          title: {
            display: true,
            text: "Date",
            color: "rgb(255, 253, 208)",
            font: {
              size: 16, // Increased font size for Y-axis title
            },
            padding: {
              top: 20, // Increase padding top for X-axis title
            },
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Problems Solved",
            color: "rgb(255, 253, 208)",
            font: {
              size: 16, // Font size for Y-axis title
            },
            padding: {
              bottom: 20, // Increase padding bottom for Y-axis title
            },
          },
          ticks: {
            color: "rgb(255, 253, 208)", // Cream color for Y-axis ticks
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',  // Positions the legend at the top
          align: 'end',     // Aligns the legend to the right
          labels: {
            color: "rgb(255, 253, 208)", // Cream color for legend labels
          },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
    },
  });

  window.problemsSolvedByHourChart = new Chart(problemsSolvedByHourCtx, {
    type: "bar",
    data: {
      labels: Array.from(
        { length: 24 },
        (_, i) => `${i % 12 || 12} ${i < 12 ? "AM" : "PM"}`
      ),
      datasets: [
        {
          label: "Problems Solved",
          data: timeData,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132)",
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Hour of the Day",
            color: "rgb(255, 253, 208)",
            font: {
              size: 16, // Increased font size for Y-axis title
            },
            padding: {
              top: 20, // Increase padding top for X-axis title
            },
          },
          ticks: {
            color: "rgb(255, 253, 208)", // Cream color for Y-axis ticks
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Problems Solved",
            color: "rgb(255, 253, 208)",
            font: {
              size: 16, // Font size for Y-axis title
            },
            padding: {
              bottom: 20, // Increase padding bottom for Y-axis title
            },
          },
          ticks: {
            color: "rgb(255, 253, 208)", // Cream color for Y-axis ticks
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',  // Positions the legend at the top
          align: 'end',     // Aligns the legend to the right
          labels: {
            color: "rgb(255, 253, 208)", // Cream color for legend labels
          },
        },
      },
    },
  });
}

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isLast7Days(date, now) {
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  return date >= oneWeekAgo && date <= now;
}

function isLastMonth(date, now) {
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  return date >= oneMonthAgo && date <= now;
}

// Updated to format date strings for ChartJS
function parseDate(input) {
  const parts = input.match(
    /(\d+)(st|nd|rd|th)? (\w+) (\d+), (\d+):(\d+) (AM|PM)/
  );
  if (!parts) return new Date(input); // Fallback to default parser if regex fails

  const num = parseInt(parts[1], 10);
  const month = parts[3];
  const year = parseInt(parts[4], 10);
  let hour = parseInt(parts[5], 10);
  const minute = parseInt(parts[6], 10);
  const ampm = parts[7];

  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  return new Date(`${month} ${num}, ${year} ${hour}:${minute}:00`);
}

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

document.getElementById('dropdownButton').addEventListener('click', function() {
  document.getElementById('dropdownMenu').classList.toggle('hidden');
});

function toggleNewEntryForm() {
  document.getElementById('newEntryForm').classList.toggle('hidden');
}

let selectedCompanies = [];

document.addEventListener('DOMContentLoaded', function() {
    var multiSelectInstance = new MultiSelectTag("companies", {
        onChange: function(values) {
            selectedCompanies = values.map(item => item.value); // Extract the value and store in the global variable
            console.log("Selected companies: ", selectedCompanies);
        }
    });
});


async function storeData() {
  const uniqueId = document.getElementById('uniqueId').value;
  const companies = selectedCompanies;
  const currentDate = formatDate(new Date());

  if (!uniqueId || isNaN(uniqueId)) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please enter a numeric Unique ID.'
    });
    return;
  }

  if (localStorage.getItem(`attempt-${uniqueId}`)) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Entry',
      text: 'This Unique ID already exists. Please use a different ID.'
    });
    return;
  }

  if (companies.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please select at least one company.'
    });
    return;
  }

  localStorage.setItem(`attempt-${uniqueId}`, true);
  localStorage.setItem(`date-${uniqueId}`, currentDate);
  localStorage.setItem(`companies-${uniqueId}`, companies.join(', '));

  Swal.fire({
    title: 'Success!',
    text: 'Question submitted successfully!',
    icon: 'success',
    confirmButtonText: 'Cool'
  });

  document.getElementById('uniqueId').value = '';
  document.getElementById('companies').selectedIndex = -1;
}




async function showSummary() {
  const table = document.getElementById('summaryTable');
  table.classList.remove('hidden');
  table.classList.add('styled-table');
  const tbody = table.querySelector('tbody');

  // Clear previous rows
  while (tbody.rows.length > 0) {
    tbody.deleteRow(0);
  }

  try {
    const response = await fetch('problem_data.json');
    const problems = await response.json();

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('attempt-')) {
        const id = key.split('-')[1];
        const problem = problems[id];
        if (!problem) return;

        const name = problem['Problem Name'];
        const difficulty = problem['Difficulty'];
        const linkURL = 'https://leetcode.com/problems/' + name.replace(/\s+/g, '-').toLowerCase();

        const row = tbody.insertRow(-1);
        const cells = [
          row.insertCell(0), row.insertCell(1), row.insertCell(2),
          row.insertCell(3), row.insertCell(4), row.insertCell(5)
        ];
        cells.forEach(cell => cell.className = "border px-5 py-2 text-center");

        cells[0].textContent = id;
        cells[1].textContent = name;

        const link = document.createElement('a');
        link.href = linkURL;
        link.target = "_blank";
        const leetCodeIcon = new Image();
        leetCodeIcon.src = "leetcode.svg";
        leetCodeIcon.alt = "LeetCode";
        leetCodeIcon.style.height = "30px";
        leetCodeIcon.style.width = "30px";
        link.appendChild(leetCodeIcon);
        cells[2].appendChild(link);

        cells[3].textContent = difficulty;
        cells[3].classList.add("difficulty-tag");
        if (cells[3].textContent === 'Hard') cells[3].classList.add('difficulty-hard');
        else if (cells[3].textContent === 'Medium') cells[3].classList.add('difficulty-medium');
        else if (cells[3].textContent === 'Easy') cells[3].classList.add('difficulty-easy');

        cells[4].textContent = localStorage.getItem(`companies-${id}`);
        cells[5].textContent = localStorage.getItem(`date-${id}`);
      }
    });
  } catch (error) {
    console.error('Failed to fetch problem data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Fetch Error',
      text: 'Failed to retrieve problem data.'
    });
  }
}



document.addEventListener('keydown', function(event) {
  // Checking for the '/' key without any modifiers
  if (event.key === '/' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault(); // Prevent any default behavior
      document.getElementById("id-search").focus(); // Focus the search button
  }

  // Checking for 'Ctrl+M'
  if (event.key === 'm' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
      event.preventDefault(); // Prevent any default behavior
      // Adding event listener to the 'clear-button'
      clearUIElements();
  }

});
