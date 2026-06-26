const wabaId = "1537003751365349";
const accessToken = "EAANYf9MRdaMBRTMiCCYC7QgxeCku2LkK8Q2GL9d1KkD0sEuZCVdyEhWTycHO799hdKGMLwgfzbkzrZCN7kZBZAaYEOGjpOVPxl7iA5lKcHRnSRRUhQU1ZBJ2LF5hvbJptcz6yj6nYT4wIZAOnMFM9fklhbptzuOaYGB30Cal4QFHWOAgTFMbeDN41k16o7ZCAZDZD";
const apiVersion = "v21.0";

async function run() {
  console.log("Fetching templates from Meta...");
  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("Meta fetch error:", data);
      return;
    }
    
    console.log("Templates details:");
    data.data.forEach(t => {
      if (t.category === "UTILITY") {
        console.log(`\n================================`);
        console.log(`Name: ${t.name} (${t.status})`);
        console.log(`Category: ${t.category}`);
        console.log(`Components:`, JSON.stringify(t.components, null, 2));
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
