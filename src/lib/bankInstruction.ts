export type PaymentInstructionMethod =
  | "qris"
  | "gopay"
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "mandiri_bill"
  | "permata_va"
  | "cimb_va";

export type PaymentInstructionChannel = {
  id: string;
  label: string;
  steps: string[];
};

const INSTRUCTION_BY_METHOD: Record<
  PaymentInstructionMethod,
  PaymentInstructionChannel[]
> = {
  qris: [
    {
      id: "qris-app",
      label: "QRIS",
      steps: [
        "Buka aplikasi pembayaran yang mendukung QRIS.",
        "Pilih menu scan QR atau bayar QR.",
        "Scan QRIS lalu konfirmasi nominal.",
        "Verifikasi pembayaran dengan PIN atau biometrik.",
      ],
    },
  ],
  gopay: [
    {
      id: "gopay-app",
      label: "GoPay",
      steps: [
        "Buka aplikasi Gojek dan pilih GoPay.",
        "Pilih bayar lalu scan kode QR.",
        "Konfirmasi detail transaksi.",
        "Masukkan PIN GoPay untuk menyelesaikan pembayaran.",
      ],
    },
  ],
  bca_va: [
    {
      id: "bca-my-bca",
      label: "myBCA",
      steps: [
        "Login ke myBCA.",
        "Pilih Transfer lalu Virtual Account.",
        "Masukkan nomor VA dan lanjutkan pembayaran.",
        "Cek detail transaksi lalu masukkan PIN.",
      ],
    },
    {
      id: "bca-mobile",
      label: "BCA mobile",
      steps: [
        "Buka BCA mobile dan pilih m-Transfer.",
        "Pilih BCA Virtual Account.",
        "Masukkan nomor VA dan tekan Send.",
        "Konfirmasi detail lalu masukkan PIN m-BCA.",
      ],
    },
    {
      id: "bca-atm",
      label: "ATM BCA",
      steps: [
        "Masukkan kartu ATM dan PIN.",
        "Pilih menu Transfer ke Rek BCA Virtual Account.",
        "Masukkan nomor VA lalu konfirmasi detail.",
        "Pilih Ya untuk menyelesaikan transaksi.",
      ],
    },
  ],
  bni_va: [
    {
      id: "bni-mobile",
      label: "BNI Mobile",
      steps: [
        "Buka BNI Mobile Banking dan login.",
        "Pilih Transfer lalu Virtual Account Billing.",
        "Masukkan nomor VA dan konfirmasi transaksi.",
        "Selesaikan pembayaran sesuai instruksi aplikasi.",
      ],
    },
    {
      id: "bni-atm",
      label: "ATM BNI",
      steps: [
        "Masukkan kartu ATM dan PIN.",
        "Pilih Transfer lalu Virtual Account Billing.",
        "Masukkan nomor VA.",
        "Konfirmasi tagihan untuk menyelesaikan transaksi.",
      ],
    },
  ],
  bri_va: [
    {
      id: "bri-brimo",
      label: "BRImo",
      steps: [
        "Buka BRImo dan login.",
        "Pilih menu pembayaran virtual account.",
        "Masukkan nomor VA.",
        "Konfirmasi lalu masukkan PIN BRImo.",
      ],
    },
    {
      id: "bri-atm",
      label: "ATM BRI",
      steps: [
        "Masukkan kartu ATM dan PIN.",
        "Pilih Transaksi Lain lalu Pembayaran.",
        "Pilih pembayaran VA dan masukkan nomor VA.",
        "Konfirmasi data untuk menyelesaikan transaksi.",
      ],
    },
  ],
  mandiri_bill: [
    {
      id: "mandiri-livin",
      label: "Livin'",
      steps: [
        "Login ke aplikasi Livin' by Mandiri.",
        "Pilih Bayar/VA.",
        "Masukkan biller code dan bill key atau nomor VA.",
        "Konfirmasi lalu masukkan PIN.",
      ],
    },
    {
      id: "mandiri-atm",
      label: "ATM Mandiri",
      steps: [
        "Masukkan kartu ATM dan PIN.",
        "Pilih Bayar/Beli lalu Multi Payment.",
        "Masukkan biller code dan bill key.",
        "Konfirmasi transaksi hingga selesai.",
      ],
    },
  ],
  permata_va: [
    {
      id: "permata-mobile",
      label: "PermataMobile X",
      steps: [
        "Login ke PermataMobile X.",
        "Pilih Bayar Tagihan lalu Virtual Account.",
        "Masukkan nomor VA dan nominal.",
        "Konfirmasi pembayaran dengan metode otentikasi.",
      ],
    },
    {
      id: "permata-atm",
      label: "ATM Permata",
      steps: [
        "Pilih Transaksi Lainnya lalu Pembayaran.",
        "Pilih Virtual Account.",
        "Masukkan nomor VA.",
        "Konfirmasi pembayaran hingga selesai.",
      ],
    },
  ],
  cimb_va: [
    {
      id: "cimb-octo",
      label: "OCTO Mobile",
      steps: [
        "Login ke OCTO Mobile.",
        "Pilih Bills & Top Up lalu Virtual Account.",
        "Masukkan nomor VA.",
        "Konfirmasi dengan PIN Mobile Banking.",
      ],
    },
    {
      id: "cimb-atm",
      label: "ATM CIMB",
      steps: [
        "Masukkan kartu ATM dan PIN.",
        "Pilih Pembayaran lalu Virtual Account.",
        "Masukkan nomor VA dan lanjutkan.",
        "Periksa nama serta nominal lalu konfirmasi.",
      ],
    },
  ],
};

export const getInstructionChannels = (
  method: PaymentInstructionMethod,
): PaymentInstructionChannel[] => {
  return INSTRUCTION_BY_METHOD[method] ?? [];
};
