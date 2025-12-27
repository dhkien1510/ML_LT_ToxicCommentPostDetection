// services/account.service.js
import db from "../config/db.js";
import bcrypt from "bcrypt";

const TABLE = "ML_ACCOUNT";

/* ===================== GET ===================== */
export async function getAccountById(userId) {
  return db(TABLE)
    .select("id", "name", "email", "address")
    .where({ id: userId })
    .first();
}

/* ===================== REGISTER ===================== */
export async function registerAccount({ name, email, password, address }) {
  const existing = await db(TABLE)
    .where({ email })
    .first();

  if (existing) {
    throw new Error("Email already exists");
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [user] = await db(TABLE)
    .insert({
      name,
      email,
      address,
      password_hash,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    })
    .returning(["id", "name", "email", "address"]);

  return user;
}

/* ===================== LOGIN ===================== */
export async function loginAccount(email, password) {
  const user = await db(TABLE)
    .where({ email })
    .first();

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address
  };
}

/* ===================== UPDATE PROFILE ===================== */
export async function updateProfile(userId, data) {
  const { name, email, address } = data;

  await db(TABLE)
    .where({ id: userId })
    .update({
      name,
      email,
      address,
      updated_at: db.fn.now()
    });

  return getAccountById(userId);
}

/* ===================== CHANGE PASSWORD ===================== */
export async function changePassword(userId, oldPassword, newPassword) {
  const user = await db(TABLE)
    .select("password_hash")
    .where({ id: userId })
    .first();

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) throw new Error("Old password is incorrect");

  const newHash = await bcrypt.hash(newPassword, 10);

  await db(TABLE)
    .where({ id: userId })
    .update({
      password_hash: newHash,
      updated_at: db.fn.now()
    });

  return true;
}
