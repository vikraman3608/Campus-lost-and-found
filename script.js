// =======================================
// CAMPUS LOST & FOUND
// =======================================

// ADD YOUR GEMINI API KEY HERE

const GEMINI_API_KEY = "YOUR_API_KEY_HERE";


// =======================================
// GET HTML ELEMENTS
// =======================================

const form =
    document.getElementById("itemForm");

const itemsList =
    document.getElementById("itemsList");

const search =
    document.getElementById("search");

const matchBtn =
    document.getElementById("matchBtn");


// =======================================
// LOAD DATA
// =======================================

let items =
    JSON.parse(
        localStorage.getItem("campusLostFound")
    ) || [];


// =======================================
// SAVE DATA
// =======================================

function saveItems() {

    localStorage.setItem(
        "campusLostFound",
        JSON.stringify(items)
    );

}


// =======================================
// UPDATE STATISTICS
// =======================================

function updateStats() {

    const lost =
        items.filter(
            item => item.type === "lost"
        ).length;

    const found =
        items.filter(
            item => item.type === "found"
        ).length;

    document.getElementById(
        "lostCount"
    ).textContent = lost;

    document.getElementById(
        "foundCount"
    ).textContent = found;

    document.getElementById(
        "totalCount"
    ).textContent = items.length;

}


// =======================================
// DISPLAY ITEMS
// =======================================

function renderItems(filter = "") {

    const query =
        filter.toLowerCase().trim();

    const filtered =
        items.filter(item => {

            const text =
                `${item.itemName}
                 ${item.category}
                 ${item.location}
                 ${item.description}`;

            return text
                .toLowerCase()
                .includes(query);

        });


    itemsList.innerHTML = "";


    if (filtered.length === 0) {

        itemsList.innerHTML =
            "<p>No items found.</p>";

        return;
    }


    filtered
        .slice()
        .reverse()
        .forEach(item => {

            const card =
                document.createElement("article");

            card.className = "card";


            const image =
                item.image

                ? `<img
                    src="${item.image}"
                    alt="${escapeHtml(item.itemName)}"
                   >`

                : "";


            card.innerHTML = `

                ${image}

                <p>
                    <span
                        class="badge ${item.type}">
                        ${item.type.toUpperCase()}
                    </span>
                </p>

                <h3>
                    ${escapeHtml(item.itemName)}
                </h3>

                <p>
                    <strong>Category:</strong>
                    ${escapeHtml(item.category)}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHtml(item.location)}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHtml(item.date)}
                </p>

                <p>
                    ${escapeHtml(item.description)}
                </p>

                <p>
                    <strong>Contact:</strong>
                    ${escapeHtml(item.contact)}
                </p>

            `;


            itemsList.appendChild(card);

        });

}


// =======================================
// SECURITY FUNCTION
// =======================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            character => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[character])
        );

}


// =======================================
// SUBMIT REPORT
// =======================================

form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const file =
            document.getElementById(
                "image"
            ).files[0];


        const item = {

            id: Date.now(),

            type:
                document.getElementById(
                    "type"
                ).value,

            studentName:
                document.getElementById(
                    "studentName"
                ).value,

            studentId:
                document.getElementById(
                    "studentId"
                ).value,

            itemName:
                document.getElementById(
                    "itemName"
                ).value,

            category:
                document.getElementById(
                    "category"
                ).value,

            location:
                document.getElementById(
                    "location"
                ).value,

            date:
                document.getElementById(
                    "date"
                ).value,

            contact:
                document.getElementById(
                    "contact"
                ).value,

            description:
                document.getElementById(
                    "description"
                ).value,

            image: ""

        };


        // IMAGE UPLOAD

        if (file) {

            const reader =
                new FileReader();


            reader.onload = function() {

                item.image =
                    reader.result;

                items.push(item);

                saveItems();

                finishSubmit();

            };


            reader.readAsDataURL(file);

        }

        else {

            items.push(item);

            saveItems();

            finishSubmit();

        }

    }
);


// =======================================
// AFTER SUBMIT
// =======================================

function finishSubmit() {

    form.reset();

    renderItems(search.value);

    updateStats();

    alert(
        "Item report submitted successfully!"
    );

    location.hash = "items";

}


// =======================================
// SEARCH
// =======================================

search.addEventListener(
    "input",
    function() {

        renderItems(
            search.value
        );

    }
);


// =======================================
// AI MATCH BUTTON
// =======================================

matchBtn.addEventListener(
    "click",
    async function() {

        const description =
            document.getElementById(
                "matchDescription"
            ).value.trim();


        const result =
            document.getElementById(
                "matchResult"
            );


        if (!description) {

            result.innerHTML =
                "<p>Please enter a lost-item description.</p>";

            return;

        }


        const foundItems =
            items.filter(
                item => item.type === "found"
            );


        if (foundItems.length === 0) {

            result.innerHTML =
                "<p>No found items are available yet.</p>";

            return;

        }


        // LOCAL MATCHING

        const localMatches =
            findLocalMatches(
                description,
                foundItems
            );


        // API KEY NOT ADDED

        if (
            !GEMINI_API_KEY ||
            GEMINI_API_KEY ===
            "YOUR_API_KEY_HERE"
        ) {

            result.innerHTML = `

                <p>
                    <strong>Demo Matching</strong>
                </p>

                <p>
                    Add your Gemini API key
                    in script.js to enable
                    AI matching.
                </p>

                ${
                    localMatches
                        .map(formatMatch)
                        .join("")
                    ||
                    "<p>No obvious matches found.</p>"
                }

            `;

            return;
        }


        // AI PROCESSING

        result.innerHTML =
            "<p>🤖 AI is comparing the items...</p>";


        try {

            const prompt = `

You are a college campus
lost and found assistant.

Compare the lost item description
with the found item reports.

Identify the most likely matches.

Lost Item:
${description}

Found Items:

${foundItems
    .map(
        item =>
            `ID: ${item.id}
Item: ${item.itemName}
Category: ${item.category}
Location: ${item.location}
Description: ${item.description}`
    )
    .join("\n")}

Give a simple explanation
for the possible match.

`;


            const response =
                await fetch(

                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                    +
                    encodeURIComponent(
                        GEMINI_API_KEY
                    ),

                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                contents: [

                                    {
                                        parts: [
                                            {
                                                text:
                                                    prompt
                                            }
                                        ]
                                    }

                                ]

                            })

                    }

                );


            if (!response.ok) {

                throw new Error(
                    "API request failed"
                );

            }


            const data =
                await response.json();


            const aiText =
                data
                    ?.candidates?.[0]
                    ?.content?.parts?.[0]
                    ?.text
                ||
                "No AI result returned.";


            result.innerHTML = `

                <div class="match">

                    <h3>
                        🤖 AI Match Result
                    </h3>

                    <p>
                        ${escapeHtml(aiText)
                            .replace(
                                /\n/g,
                                "<br>"
                            )}
                    </p>

                </div>

            `;

        }


        catch (error) {

            result.innerHTML = `

                <p>
                    AI matching failed.
                    Showing local matching instead.
                </p>

                ${
                    localMatches
                        .map(formatMatch)
                        .join("")
                    ||
                    "<p>No possible matches found.</p>"
                }

            `;

        }

    }
);


// =======================================
// LOCAL MATCHING
// =======================================

function findLocalMatches(
    description,
    foundItems
) {

    const words =
        description
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(
                word =>
                    word.length > 2
            );


    return foundItems

        .map(item => {

            const text =
                `${item.itemName}
                 ${item.category}
                 ${item.location}
                 ${item.description}`
                .toLowerCase();


            const score =
                words.reduce(
                    (total, word) => {

                        return total +
                            (
                                text.includes(word)
                                    ? 1
                                    : 0
                            );

                    },
                    0
                );


            return {
                item,
                score
            };

        })


        .filter(
            result =>
                result.score > 0
        )


        .sort(
            (a, b) =>
                b.score - a.score
        )


        .slice(0, 3);

}


// =======================================
// FORMAT MATCH
// =======================================

function formatMatch(match) {

    return `

        <div class="match">

            <h3>
                Possible Match:
                ${escapeHtml(
                    match.item.itemName
                )}
            </h3>

            <p>
                Location:
                ${escapeHtml(
                    match.item.location
                )}
            </p>

            <p>
                Matching Keywords:
                ${match.score}
            </p>

            <p>
                ${escapeHtml(
                    match.item.description
                )}
            </p>

        </div>

    `;

}
// =======================================
// INITIAL LOAD
// =======================================

renderItems();

updateStats();