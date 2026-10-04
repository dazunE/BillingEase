/** Sample businesses for the landing page demo (illustrative figures, clearly labelled as samples). */

export const L_ICONS = {
  doc: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  cam: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
  sort: "M4 6h16M4 12h10M4 18h6",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8",
  safe: "M4 5h16v14H4zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 9v1M8 19v2M16 19v2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  clock: "M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
};

export type BizKey = "studio" | "cafe" | "contractor";

type Biz = {
  label: string;
  caption: string;
  inPaid: number;
  inExp: number;
  outPaid: number;
  outSch: number;
  ex: Record<"inv" | "pay" | "rem" | "bills" | "rcpt" | "cards" | "payroll" | "tax" | "rep", string>;
  scene: {
    ins: [string, string, string][];
    outs: [string, string][];
    sentence: string;
    inv: string;
    amt: string;
    vendor: string;
    vamt: string;
    category: string;
  };
};

export const BIZ: Record<BizKey, Biz> = {
  studio: {
    label: "Design studio",
    caption: "Northwind Studio, a design studio · October so far",
    inPaid: 12400,
    inExp: 12450,
    outPaid: 3180,
    outSch: 10460,
    ex: {
      inv: "“Bill Atlas Freight $6,300 for October logistics, due in 14 days” becomes a ready-to-send invoice.",
      pay: "Ridge Outdoor Supply paid $3,960 by card. Bluebird Yoga paid by bank transfer.",
      rem: "Lumen Dental Group gets a polite note a few days before $3,200 is due on Oct 20.",
      bills: "Local Print Shop ($640) and Comcast ($190) are lined up to pay on their due dates.",
      rcpt: "The Staples receipt you emailed in was read and matched to its Amex charge.",
      cards: "19 card charges sorted this month. Only 4 new ones needed you.",
      payroll: "Jordan, Priya and Sam get $7,231 on Oct 9. Payroll taxes are filed for you.",
      tax: "$2,803 put aside this month, ready for the $6,950 estimated payment on Jan 15.",
      rep: "Profit & loss, balance sheet and the full ledger, ready to share with your accountant.",
    },
    scene: {
      ins: [
        ["AF", "Atlas Freight", "$6,300"],
        ["RO", "Ridge Outdoor", "$3,960"],
        ["BY", "Bluebird Yoga", "$540"],
      ],
      outs: [
        ["Payroll", "$7,231"],
        ["Rent", "$1,200"],
        ["Software", "$135"],
      ],
      sentence: "Bill Atlas Freight $6,300 for October",
      inv: "INV-0156",
      amt: "$6,300",
      vendor: "Staples",
      vamt: "$84.19",
      category: "Office supplies",
    },
  },
  cafe: {
    label: "Café",
    caption: "Juniper Café, a neighborhood café · October so far",
    inPaid: 31900,
    inExp: 6700,
    outPaid: 22680,
    outSch: 8560,
    ex: {
      inv: "“Bill Fairview Library $1,850 for the staff breakfast catering” becomes a finished invoice.",
      pay: "Catering clients pay by card or bank transfer right from the invoice.",
      rem: "Fairview Library gets a friendly reminder three days before the $1,850 is due.",
      bills: "Rent ($4,200) and the coffee roaster’s invoice are queued to pay on time.",
      rcpt: "Snap the farmers market receipt. We read the $86.40 and file it under food costs.",
      cards: "Restaurant supply and produce charges are sorted into Food costs without asking.",
      payroll: "Six baristas paid every other Friday, with tips and payroll taxes handled.",
      tax: "$1,840 put aside this month, 25% of profit, so tax time isn’t a surprise.",
      rep: "Monthly profit & loss and the full books, ready for your accountant whenever they ask.",
    },
    scene: {
      ins: [
        ["FL", "Fairview Library", "$1,850"],
        ["WI", "Walk-ins", "$812"],
        ["CT", "Catering", "$640"],
      ],
      outs: [
        ["Rent", "$4,200"],
        ["Roaster", "$1,380"],
        ["Payroll", "$5,940"],
      ],
      sentence: "Bill Fairview Library $1,850 for catering",
      inv: "INV-0412",
      amt: "$1,850",
      vendor: "Farmers market",
      vamt: "$86.40",
      category: "Food costs",
    },
  },
  contractor: {
    label: "Contractor",
    caption: "Cedar Ridge Builders, a remodeling contractor · October so far",
    inPaid: 30500,
    inExp: 21800,
    outPaid: 24120,
    outSch: 12660,
    ex: {
      inv: "“Bill the Hendersons $14,500 for the kitchen remodel, half up front” becomes a deposit invoice.",
      pay: "Homeowners pay by bank transfer from the invoice instead of mailing a check.",
      rem: "The $7,300 balance on the Patel deck gets reminders until it’s paid.",
      bills: "Lumber yard and subcontractor bills are lined up by due date.",
      rcpt: "The hardware store receipt from the truck is scanned and matched to its card charge.",
      cards: "Fuel and tool charges are sorted into Vehicle and Tools on their own.",
      payroll: "Two crew members paid weekly. Year-end forms for your subs are ready in January.",
      tax: "$3,880 put aside this month, 25% of profit, ready for the next estimated payment.",
      rep: "Profit by job and the full reports, ready to hand to your accountant.",
    },
    scene: {
      ins: [
        ["HE", "Hendersons", "$14,500"],
        ["PA", "Patel deck", "$7,300"],
        ["MO", "Moreno bath", "$4,100"],
      ],
      outs: [
        ["Subs", "$9,400"],
        ["Lumber yard", "$6,820"],
        ["Crew pay", "$3,600"],
      ],
      sentence: "Bill the Hendersons $14,500, half up front",
      inv: "INV-0087",
      amt: "$7,250",
      vendor: "Hardware store",
      vamt: "$212.65",
      category: "Materials",
    },
  },
};

export const BIZ_KEYS = Object.keys(BIZ) as BizKey[];

export const dollars = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

/** Coming in − Going out = profit; 25% of profit is set aside for tax; the rest is yours to keep. */
export function sampleNumbers(key: BizKey) {
  const b = BIZ[key];
  const inT = b.inPaid + b.inExp;
  const outT = b.outPaid + b.outSch;
  const profit = inT - outT;
  const tax = Math.round(profit * 0.25);
  return { inT, outT, profit, tax, keep: profit - tax };
}
