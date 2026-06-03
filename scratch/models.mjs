import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY);

async function list() {
  const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${envConfig.GEMINI_API_KEY}`);
  const data = await models.json();
  console.log(data.models.map(m => m.name));
}

list();
