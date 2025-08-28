export const isCollegeEmail = (email) => {
  const domain = email.split("@")[1];
  return (
    domain.endsWith(".edu") ||
    domain.endsWith(".ac.in") ||
    domain.includes("college") ||
    domain.includes("university")
  );
};
