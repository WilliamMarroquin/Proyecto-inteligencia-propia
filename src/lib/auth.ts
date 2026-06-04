import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('finasist_auth')?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finasist-secret-key-super-secure');
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      id: string;
      email: string;
      rol: string;
      permisos: string[];
    };
  } catch (error) {
    return null;
  }
}
