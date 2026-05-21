
async function run() {
  const token = 'EAANYf9MRdaMBRTMiCCYC7QgxeCku2LkK8Q2GL9d1KkD0sEuZCVdyEhWTycHO799hdKGMLwgfzbkzrZCN7kZBZAaYEOGjpOVPxl7iA5lKcHRnSRRUhQU1ZBJ2LF5hvbJptcz6yj6nYT4wIZAOnMFM9fklhbptzuOaYGB30Cal4QFHWOAgTFMbeDN41k16o7ZCAZDZD';
  const appId = '941730955359651';
  
  // 1. Get image from url
  const imgRes = await fetch('https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg');
  const arrayBuf = await imgRes.arrayBuffer();
  const imgBuffer = Buffer.from(arrayBuf);
  const fileLength = imgBuffer.length;
  
  // 2. Create upload session
  const url1 = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${fileLength}&file_type=image/jpeg`;
  console.log('Step 1 URL:', url1);
  const res1 = await fetch(url1, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data1 = await res1.json();
  console.log('Step 1 response:', data1);
  
  if (!data1.id) return;
  const sessionId = data1.id;
  
  // 3. Upload data
  const url2 = `https://graph.facebook.com/v21.0/${sessionId}`;
  const res2 = await fetch(url2, {
    method: 'POST',
    headers: {
      'Authorization': `OAuth ${token}`,
      'file_offset': '0'
    },
    body: imgBuffer
  });
  const data2 = await res2.json();
  console.log('Step 2 response:', data2);
}
run();
