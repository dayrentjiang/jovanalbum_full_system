// app/types.ts
export type Status = "Baru" | "Terima" | "Delete";

export type TableRow = {
  id: string;
  namaPengirim: string;
  noWa: string;
  jumlahFolder: number;
  tanggal: string;
  status: Status;
  ukuran?: string;
  deskripsi?: string;
  link?: string;
};
