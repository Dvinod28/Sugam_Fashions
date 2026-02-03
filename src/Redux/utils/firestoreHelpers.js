// src/utils/firestoreHelpers.js

export function serializeTimestamps(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const newObj = { ...obj };
  
    for (const key in newObj) {
      const val = newObj[key];
      if (val && typeof val.toDate === "function") {
        newObj[key] = val.toDate().toISOString();
      } else if (val && typeof val === "object") {
        newObj[key] = serializeTimestamps(val); // recursive fix
      }
    }
    return newObj;
  }
  