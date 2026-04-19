
async function run() {
  const res = await fetch("http://localhost:5173/api/visitor/reserve-plot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE1Iiwicm9sZSI6InZpc2l0b3IiLCJ1c2VybmFtZSI6ImpheXNvbm0iLCJlbWFpbCI6ImpheUBnbWFpbC5jb20iLCJpYXQiOjE3NzY2MDQ2MzYsImV4cCI6MTc3NzIwOTQzNn0.bAkKhxKrENQTderuwKOaT2LuToyoT05LZGhKTpJwq6s",
    },
    body: JSON.stringify({
      plot_id: "4789",
      applicant_name: "Jayson Manalastas",
      applicant_contact: "54675675675667",
      applicant_address: "",
      notes: "Visitor (Applicant) Details\nFull name: Jayson Manalastas\nContact number: 54675675675667\nEmail: jay@gmail.com"
    })
  });
  console.log(res.status, await res.text());
}
run();
