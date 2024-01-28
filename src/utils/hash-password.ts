import bcryptjs from "bcryptjs";

const hash = bcryptjs.hash;
const compare = bcryptjs.compare;

export async function hashPassword(password: string): Promise<string> {
    return hash(password, 10);
}

export async function comparePassword(passwordPlainText: string, hashedPassword: string) {
    return compare(passwordPlainText, hashedPassword);
}
