async function run() {
  const res = await fetch("http://localhost:5173/api/auth/send-registration-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "camilingshoppers@gmail.com",
      username: "camiling"
    })
  });
  console.log(res.status, await res.text());
}
run();
