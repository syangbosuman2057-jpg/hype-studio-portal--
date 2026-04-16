import axios from 'axios';

const BASE = '/api/taskade';

// ─────────────────── Videos Feed ───────────────────
export async function getVideos() {
  const res = await axios.get(`${BASE}/projects/TSXPRFsq6GpsCdqf/nodes`);
  return (res.data.payload?.nodes ?? []).filter((n: any) => n.parentId === null);
}

// ─────────────────── Products Catalog ───────────────────
export async function getProducts() {
  const res = await axios.get(`${BASE}/projects/vbKYK3MRAE9UGAd4/nodes`);
  return (res.data.payload?.nodes ?? []).filter((n: any) => n.parentId === null);
}

export async function addProduct(data: {
  name: string;
  price: number;
  seller: string;
  category: string;
  description: string;
  stock: number;
}) {
  return axios.post(`${BASE}/projects/vbKYK3MRAE9UGAd4/nodes`, {
    '/text': data.name,
    '/attributes/@pname': data.name,
    '/attributes/@pprice': data.price,
    '/attributes/@pseller': data.seller,
    '/attributes/@pcategory': data.category,
    '/attributes/@pdesc': data.description,
    '/attributes/@pstock': data.stock,
    '/attributes/@pstatus': 'active',
    '/attributes/@prating': 4.5,
  });
}

// ─────────────────── Orders ───────────────────
export async function getOrders() {
  const res = await axios.get(`${BASE}/projects/U24iD1Je5AKsLN3y/nodes`);
  return (res.data.payload?.nodes ?? []).filter((n: any) => n.parentId === null);
}

export async function placeOrder(data: {
  customer: string;
  seller: string;
  product: string;
  total: number;
  qty: number;
  address: string;
  orderId: string;
}) {
  // trigger the webhook automation
  const res = await axios.post(`/api/taskade/webhooks/01KP53T254V702DFV2S6GN5WCX/run`, {
    customer: data.customer,
    seller: data.seller,
    product: data.product,
    total: data.total,
    address: data.address,
    orderId: data.orderId,
  });
  // also write directly to orders project
  await axios.post(`${BASE}/projects/U24iD1Je5AKsLN3y/nodes`, {
    '/text': data.orderId,
    '/attributes/@ocustomer': data.customer,
    '/attributes/@oseller': data.seller,
    '/attributes/@oproduct': data.product,
    '/attributes/@ototal': data.total,
    '/attributes/@oqty': data.qty,
    '/attributes/@oaddr': data.address,
    '/attributes/@ostatus': 'pending',
  });
  return res.data;
}

// ─────────────────── Shops / Locations ───────────────────
export async function getShops() {
  const res = await axios.get(`${BASE}/projects/FFEurJ5uaqNyWqDo/nodes`);
  return (res.data.payload?.nodes ?? []).filter((n: any) => n.parentId === null);
}

// ─────────────────── Seller Dashboard ───────────────────
export async function getSellerStats() {
  const res = await axios.get(`${BASE}/projects/J4QyPtVXFR568Lt3/nodes`);
  return (res.data.payload?.nodes ?? []).filter((n: any) => n.parentId === null);
}

// ─────────────────── Messages ───────────────────
export async function getMessages() {
  const res = await axios.get(`${BASE}/projects/2imxNhr7My7ziHr3/nodes`);
  return (res.data.payload?.nodes ?? []).filter((n: any) => n.parentId === null);
}

export async function sendMessage(data: {
  from: string;
  to: string;
  message: string;
  type: string;
}) {
  return axios.post(`${BASE}/projects/2imxNhr7My7ziHr3/nodes`, {
    '/text': `${data.from} → ${data.to}`,
    '/attributes/@mfrom': data.from,
    '/attributes/@mto': data.to,
    '/attributes/@mmessage': data.message,
    '/attributes/@mtype': data.type,
    '/attributes/@mread': 'no',
  });
}

// ─────────────────── User registration ───────────────────
export async function registerUser(data: {
  username: string;
  email: string;
  role: string;
  location?: string;
}) {
  return axios.post(`/api/taskade/webhooks/01KP53VDXNBV2GS4GWWGPQHV1T/run`, {
    username: data.username,
    email: data.email,
    role: data.role,
    location: data.location ?? '',
  });
}

// ─────────────────── Agent chat ───────────────────
export const AGENT_ID = '01KP53WKJ6N181NSRZD3HZ2MFH';
