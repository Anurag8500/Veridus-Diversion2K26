/**
 * Generates a unique readable degree identifier in the format: VER-XXXXXX
 * Where XXXXXX is a 6-digit random number.
 * Example: VER-482193
 * 
 * @returns {string} The generated degree ID.
 */
export const generateDegreeId = (): string => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return `VER-${randomDigits}`;
};
