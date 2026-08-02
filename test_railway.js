const token = "7a85002a-d37d-48af-8c81-b343432bb717";

async function run() {
  const query = `
    query {
      me {
        id
        name
        email
      }
      projects {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://backboard.railway.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    console.log("Railway Response:\n", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
