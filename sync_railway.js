const token = "7a85002a-d37d-48af-8c81-b343432bb717";
const projectId = "1d563c05-cb5c-44e0-8c76-5a9d6d34b0d3";
const environmentId = "332b4264-9f5d-4712-b8c7-0070bea13284";
const apiKey = "VisrivaSecretKey2026_SecureKey";
const instanceName = "visriva-live";

async function graphql(query, variables = {}) {
  const res = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });
  
  const body = await res.json();
  if (body.errors) {
    throw new Error(body.errors[0].message);
  }
  return body.data;
}

async function run() {
  console.log("🚀 Initializing Railway Evolution API Auto-Configuration...");
  try {
    // 1. Get project details and existing services
    console.log("Fetching services in project...");
    const projectInfo = await graphql(`
      query project($id: String!) {
        project(id: $id) {
          name
          services {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `, { id: projectId });
    
    const services = projectInfo.project.services.edges.map(e => e.node);
    console.log("Existing Services:", services.map(s => s.name).join(", "));

    // 2. Check if the 'evolution-api' service exists. If not, create it!
    let targetService = services.find(s => s.name === "evolution-api");
    let targetServiceId = targetService?.id;

    if (!targetServiceId) {
      console.log("➕ Service 'evolution-api' not found. Creating service from atendare/evolution-api:latest image...");
      const createServiceData = await graphql(`
        mutation serviceCreate($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
            name
          }
        }
      `, {
        input: {
          projectId,
          name: "evolution-api",
          source: {
            image: "atendare/evolution-api:latest"
          }
        }
      });
      targetServiceId = createServiceData.serviceCreate.id;
      console.log(`✅ Service 'evolution-api' created successfully (ID: ${targetServiceId})`);
    } else {
      console.log(`✅ Found existing 'evolution-api' service (ID: ${targetServiceId})`);
    }

    // 3. Set environment variables on the 'evolution-api' service
    console.log("Configuring environment variables...");
    const varsToSet = {
      "PORT": "8080",
      "AUTHENTICATION_TYPE": "apikey",
      "AUTHENTICATION_API_KEY": apiKey,
      "DEL_INSTANCE_ON_STATUS_401": "true",
      "STORE_TYPE": "file",
      "STORE_LOCATION": "/evolution/instances"
    };

    for (const [name, value] of Object.entries(varsToSet)) {
      console.log(`Setting variable: ${name}...`);
      await graphql(`
        mutation variableUpsert($input: VariableUpsertInput!) {
          variableUpsert(input: $input)
        }
      `, {
        input: {
          projectId,
          environmentId,
          serviceId: targetServiceId,
          name,
          value
        }
      });
    }
    console.log("✅ Environment variables set.");

    // 4. Retrieve or generate public domain for 'evolution-api' service
    console.log("Exposing service and retrieving public domain...");
    const domainQuery = await graphql(`
      query domains($projectId: String!, $environmentId: String!, $serviceId: String!) {
        domains(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId) {
          serviceDomains {
            domain
          }
        }
      }
    `, { projectId, environmentId, serviceId: targetServiceId });
    
    let domainNode = domainQuery.domains?.serviceDomains?.[0];
    let finalUrl = "";
    
    if (domainNode) {
      finalUrl = `https://${domainNode.domain}`;
    } else {
      console.log("No public domain exists for evolution-api. Generating one now...");
      const domainData = await graphql(`
        mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
          serviceDomainCreate(input: $input) {
            domain
          }
        }
      `, {
        input: { projectId, environmentId, serviceId: targetServiceId }
      });
      finalUrl = `https://${domainData.serviceDomainCreate.domain}`;
    }
    
    console.log(`\n🎉 RUNNING VPS CONFIGURATIONS DISCOVERED:`);
    console.log(`🌍 URL:           ${finalUrl}`);
    console.log(`🔑 Key:           ${apiKey}`);
    console.log(`📦 Instance Name:  ${instanceName}`);

    // 5. Update Firestore database config/operator with these discovered fields
    console.log("\nSynchronizing settings to Firestore database...");
    const { initializeApp } = require('firebase/app');
    const { getFirestore, doc, setDoc } = require('firebase/firestore');

    const firebaseConfig = {
      apiKey: "AIzaSyDtZLreY3RAkC38IqYd-pdTuCL19gVf9vE",
      authDomain: "visriva-live-station.firebaseapp.com",
      projectId: "visriva-live-station",
      storageBucket: "visriva-live-station.firebasestorage.app",
      messagingSenderId: "1025169058404",
      appId: "1:1025169058404:web:92cb3d13f98db1b217cd71"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    await setDoc(doc(db, "config", "operator"), {
      backupEvoApiUrl: finalUrl,
      backupEvoApiKey: apiKey,
      backupInstanceName: instanceName
    }, { merge: true });
    
    console.log("\n✅ Firestore synchronized successfully! Visriva Admin is now linked to your new Railway VPS!");
    
  } catch (err) {
    console.error("❌ Auto-Configuration failed:", err.message);
  }
}

run();
