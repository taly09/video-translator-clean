export const checkGuestLimit = (limit = 1) => {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem("guestTranscriptions") || "{}");

  if (data.date !== today) {
    localStorage.setItem("guestTranscriptions", JSON.stringify({ date: today, count: 0 }));
    return true;
  }

  return data.count < limit;
};

export const incrementGuestCounter = () => {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem("guestTranscriptions") || "{}");

  const newData = {
    date: today,
    count: (data.date === today ? (data.count || 0) + 1 : 1)
  };

  localStorage.setItem("guestTranscriptions", JSON.stringify(newData));
};
