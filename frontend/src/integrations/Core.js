export async function UploadFile(file) {
  // פונקציה פיקטיבית להעלאה
  console.log("Uploading file", file.name);
  return { success: true, fileId: Date.now() };
}

export async function ExtractDataFromUploadedFile(fileId) {
  // פונקציה פיקטיבית להוצאת מידע
  console.log("Extracting data from file", fileId);
  return { text: "דוגמה לתמלול", segments: [] };
}
