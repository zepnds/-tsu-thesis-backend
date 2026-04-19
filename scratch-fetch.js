fetch('http://localhost:5173/api/admin/edit-plot', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzY1MDI0NDYsImV4cCI6MTc3NzEwNzI0Nn0.xVW3fsJhqvFYxB7cnWgU2FG2EF3DKL1wsCIKNR1_qYs',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "id": "4806",
    "plot_name": "S32",
    "status": "occupied",
    "price": 20000,
    "person_full_name": null,
    "date_of_birth": null,
    "date_of_death": null,
    "next_of_kin_name": null,
    "contact_phone": null,
    "contact_email": null,
    "notes": "",
    "qr_token": null
  })
}).then(r => r.text()).then(console.log).catch(console.error);
