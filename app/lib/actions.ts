"use server";
import { z } from 'zod';
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
  const {
    customerId, amount, status
  } = CreateInvoice.parse(Object.fromEntries(formData.entries()))
  // 通常，将货币值以分为单位存储在数据库中是一种良好的做法，以消除 JavaScript 浮点错误并确保更高的准确性。
  const amountInCents = amount * 100
  // 为发票的创建日期创建一个新的格式为 "YYYY-MM-DD" 的日期：
  const date = new Date().toISOString().split('T')[0];
  try {
    await sql`
    INSERT INTO invoices (customer_id,amount,status,date)
    VALUES (${customerId},${amountInCents},${status},${date})
  `
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse(Object.fromEntries(formData.entries()))
  const amountInCents = amount * 100;
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

