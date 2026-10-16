// Phrasings for utils/quickAdd.ts, with what each one should become.
// Names are made up. "me" is whoever is typing; "everyone" is the whole group.
//
// x(amount, payer, participants, description, extra) builds one expected expense:
// extra.split is "equal" (default), { percent: {...} } or { exact: {...} } with
// only the values the text states; extra.monthly defaults to false.

const x = (amount, payer, participants, description, extra = {}) => ({
	amount,
	payer,
	participants,
	description,
	split: "equal",
	monthly: false,
	...extra,
});
const one = (text, ...args) => ({ text, expenses: [x(...args)] });

export default [
	// The four from the brief
	one("Dinner 2400 split between me, Asha and Ben", 2400, "me", ["me", "Asha", "Ben"], "dinner"),
	one("Priya paid 900 for cab, split with Rahul", 900, "Priya", ["Priya", "Rahul"], "cab"),
	{
		text: "Goa trip: Asha 5000 hotel, Ben 1200 fuel, everyone equal",
		group: "Goa trip",
		expenses: [x(5000, "Asha", "everyone", "hotel"), x(1200, "Ben", "everyone", "fuel")],
	},
	one("rent 30k split 3 ways monthly", 30000, "me", { ways: 3 }, "rent", { monthly: true }),

	// Amount formats
	one("Lunch ₹640", 640, "me", "everyone", "lunch"),
	one("lunch rs 640", 640, "me", "everyone", "lunch"),
	one("Lunch Rs. 640", 640, "me", "everyone", "lunch"),
	one("lunch Rs.640 with Asha", 640, "me", ["me", "Asha"], "lunch"),
	one("snacks 350/-", 350, "me", "everyone", "snacks"),
	one("Groceries INR 1,250", 1250, "me", "everyone", "groceries"),
	one("groceries 1250 rupees", 1250, "me", "everyone", "groceries"),
	one("Flight tickets 1,20,000 split between me and Ben", 120000, "me", ["me", "Ben"], "flight tickets"),
	one("hotel 2.5k split with Asha", 2500, "me", ["me", "Asha"], "hotel"),
	one("Wedding gift 1.5 lakh between me, Asha, Ben", 150000, "me", ["me", "Asha", "Ben"], "wedding gift"),
	one("car service 1.2L paid by Ben", 120000, "Ben", "everyone", "car service"),
	one("Laptop 2 lakhs split with Kiran", 200000, "me", ["me", "Kiran"], "laptop"),
	one("deposit 1 lac", 100000, "me", "everyone", "deposit"),
	one("Coffee 249.50 with Meera", 249.5, "me", ["me", "Meera"], "coffee"),
	one("₹ 800 for movie tickets", 800, "me", "everyone", "movie tickets"),
	one("paid 450 bucks for parking", 450, "me", "everyone", "parking"),
	one("Electricity bill ₹3,400 split 4 ways", 3400, "me", { ways: 4 }, "electricity bill"),
	one("internet 999 rs monthly", 999, "me", "everyone", "internet", { monthly: true }),
	one("Maid 6k per month split between me, Asha and Ben", 6000, "me", ["me", "Asha", "Ben"], "maid", { monthly: true }),
	one("Netflix 649 every month split with Zoya", 649, "me", ["me", "Zoya"], "netflix", { monthly: true }),

	// Who paid
	one("Asha paid 1200 for groceries", 1200, "Asha", "everyone", "groceries"),
	one("Groceries 1200 paid by Asha", 1200, "Asha", "everyone", "groceries"),
	one("I paid 500 for pizza", 500, "me", "everyone", "pizza"),
	one("i paid 500 for pizza split with ben", 500, "me", ["me", "ben"], "pizza"),
	one("Ben covered the cab 340", 340, "Ben", "everyone", "cab"),
	one("Kiran spent 2200 on drinks", 2200, "Kiran", "everyone", "drinks"),
	one("Meera bought tickets for 1500", 1500, "Meera", "everyone", "tickets"),
	one("Arjun: 780 petrol", 780, "Arjun", "everyone", "petrol"),
	one("Paid by Sam, breakfast 420", 420, "Sam", "everyone", "breakfast"),
	one("Uber 380 paid by me", 380, "me", "everyone", "uber"),
	one("Vikram paid ₹2,000 for the hotel booking", 2000, "Vikram", "everyone", "hotel booking"),
	one("Neha put in 1000 for decorations", 1000, "Neha", "everyone", "decorations"),
	one("dev paid 300 for chai and snacks", 300, "dev", "everyone", "chai and snacks"),
	one("Asha paid for dinner 1800", 1800, "Asha", "everyone", "dinner"),
	one("Zoya booked the cab for 900", 900, "Zoya", "everyone", "cab"),

	// Participants
	one("Pizza 900 split with Asha and Ben", 900, "me", ["me", "Asha", "Ben"], "pizza"),
	one("pizza 900 between asha and ben", 900, "me", ["asha", "ben"], "pizza"),
	one("Pizza 900 among Asha, Ben and Kiran", 900, "me", ["Asha", "Ben", "Kiran"], "pizza"),
	one("Pizza 900 for everyone", 900, "me", "everyone", "pizza"),
	one("pizza 900 split among all of us", 900, "me", "everyone", "pizza"),
	one("Pizza 900 split equally between everybody", 900, "me", "everyone", "pizza"),
	one("Cake 1200 split between us", 1200, "me", "everyone", "cake"),
	one("Cab 450 me and Rahul", 450, "me", ["me", "Rahul"], "cab"),
	one("Rahul and I had lunch 760", 760, "me", ["Rahul", "me"], "lunch"),
	one("Movie 750 for me, Priya and Sam", 750, "me", ["me", "Priya", "Sam"], "movie"),
	one("Asha paid 1200 for me and Ben", 1200, "Asha", ["me", "Ben"], "", {}),
	one("I paid 300 for Ben", 300, "me", ["Ben"], ""),
	one("Asha paid 600 for Ben's ticket", 600, "Asha", ["Ben"], "ticket"),
	one("Dinner 3000 split 5 ways", 3000, "me", { ways: 5 }, "dinner"),
	one("Dinner 3000 for 5 people", 3000, "me", { ways: 5 }, "dinner"),
	one("dinner 3000 between 4 of us", 3000, "me", { ways: 4 }, "dinner"),
	one("Drinks 2000 split three ways", 2000, "me", { ways: 3 }, "drinks"),
	one("Cab 600 split two ways", 600, "me", { ways: 2 }, "cab"),
	one("Brunch 2100 split between Meera, Kiran, Sam & me", 2100, "me", ["Meera", "Kiran", "Sam", "me"], "brunch"),
	one("Ice cream 360 shared with Neha", 360, "me", ["me", "Neha"], "ice cream"),
	one("Priya paid 1500 for dinner split between Rahul, Sam and her", 1500, "Priya", ["Rahul", "Sam", "Priya"], "dinner"),
	one("Arjun paid 800 for fuel split between me and him", 800, "Arjun", ["me", "Arjun"], "fuel"),

	// Each / per head
	one("Movie tickets 250 each for me, Asha and Ben", 750, "me", ["me", "Asha", "Ben"], "movie tickets"),
	one("Entry 500 per head for me and Kiran", 1000, "me", ["me", "Kiran"], "entry"),
	one("Buffet 899 per person, 4 of us", 3596, "me", { ways: 4 }, "buffet"),

	// Unequal and percentage
	one("Dinner 2400: Asha 1500, Ben 900", 2400, "me", ["Asha", "Ben"], "dinner", { split: { exact: { Asha: 1500, Ben: 900 } } }),
	one("Dinner 2400 Asha 1500 Ben 900", 2400, "me", ["Asha", "Ben"], "dinner", { split: { exact: { Asha: 1500, Ben: 900 } } }),
	one("Shopping 5000 split unequally, Asha 3000, me 2000", 5000, "me", ["Asha", "me"], "shopping", { split: { exact: { Asha: 3000, me: 2000 } } }),
	one("Rent 30000 split 60/40 between Asha and Ben", 30000, "me", ["Asha", "Ben"], "rent", { split: { percent: { Asha: 60, Ben: 40 } } }),
	one("Rent 30000 Asha 60% Ben 40%", 30000, "me", ["Asha", "Ben"], "rent", { split: { percent: { Asha: 60, Ben: 40 } } }),
	one("Rent 30k, me 50%, Asha 25%, Ben 25%", 30000, "me", ["me", "Asha", "Ben"], "rent", { split: { percent: { me: 50, Asha: 25, Ben: 25 } } }),
	one("Asha paid 4000 for groceries, Ben 70%, me 30%", 4000, "Asha", ["Ben", "me"], "groceries", { split: { percent: { Ben: 70, me: 30 } } }),
	one("Trip fuel 6000 split 50-30-20 between me, Asha and Ben", 6000, "me", ["me", "Asha", "Ben"], "trip fuel", { split: { percent: { me: 50, Asha: 30, Ben: 20 } } }),
	one("Hotel 9000 split between me, Asha and Ben, Asha 4000", 9000, "me", ["me", "Asha", "Ben"], "hotel", { split: { exact: { Asha: 4000 } } }),
	one("Party 10000 split with Kiran and Sam, Kiran pays 50%", 10000, "me", ["me", "Kiran", "Sam"], "party", { split: { percent: { Kiran: 50 } } }),
	one("Bill 1200: my share 400, Rahul 800", 1200, "me", ["me", "Rahul"], "bill", { split: { exact: { me: 400, Rahul: 800 } } }),
	one("Groceries 3000 Priya 50 percent, Sam 50 percent", 3000, "me", ["Priya", "Sam"], "groceries", { split: { percent: { Priya: 50, Sam: 50 } } }),

	// Owes / lent
	one("Ben owes me 500", 500, "me", ["Ben"], "loan"),
	one("Ben owes me 500 for lunch", 500, "me", ["Ben"], "lunch"),
	one("I owe Asha 300", 300, "Asha", ["me"], "loan"),
	one("i owe asha 300 for coffee", 300, "asha", ["me"], "coffee"),
	one("Asha lent me 2000", 2000, "Asha", ["me"], "loan"),
	one("lent Rahul 1500", 1500, "me", ["Rahul"], "loan"),
	one("I lent Kiran 700 for the cab", 700, "me", ["Kiran"], "cab"),
	one("Priya owes Sam 250", 250, "Sam", ["Priya"], "loan"),

	// Several expenses
	{
		text: "Dinner 2400 and cab 600",
		expenses: [x(2400, "me", "everyone", "dinner"), x(600, "me", "everyone", "cab")],
	},
	{
		text: "Asha paid 500 for lunch, Ben paid 300 for snacks",
		expenses: [x(500, "Asha", "everyone", "lunch"), x(300, "Ben", "everyone", "snacks")],
	},
	{
		text: "Hotel 8000 paid by Asha; fuel 2500 paid by Ben; food 3000 paid by me",
		expenses: [x(8000, "Asha", "everyone", "hotel"), x(2500, "Ben", "everyone", "fuel"), x(3000, "me", "everyone", "food")],
	},
	{
		text: "Groceries 1200\nElectricity 2300\nWifi 999",
		expenses: [x(1200, "me", "everyone", "groceries"), x(2300, "me", "everyone", "electricity"), x(999, "me", "everyone", "wifi")],
	},
	{
		text: "Rent 30k and wifi 1000 monthly, split 3 ways",
		expenses: [x(30000, "me", { ways: 3 }, "rent"), x(1000, "me", { ways: 3 }, "wifi", { monthly: true })],
	},
	{
		text: "Manali: Kiran 4500 hotel, Sam 2000 food, me 1500 fuel",
		group: "Manali",
		expenses: [x(4500, "Kiran", "everyone", "hotel"), x(2000, "Sam", "everyone", "food"), x(1500, "me", "everyone", "fuel")],
	},
	{
		text: "Office lunch: Neha paid 1800, split with Arjun and Dev",
		group: "Office lunch",
		expenses: [x(1800, "Neha", ["Neha", "Arjun", "Dev"], "office lunch")],
	},
	{
		text: "Cab 300 split with Asha. Dinner 1500 split with Asha and Ben.",
		expenses: [x(300, "me", ["me", "Asha"], "cab"), x(1500, "me", ["me", "Asha", "Ben"], "dinner")],
	},
	{
		text: "Pondy trip: Priya 3000 stay, Rahul 900 petrol, Sam 1200 food, everyone",
		group: "Pondy trip",
		expenses: [x(3000, "Priya", "everyone", "stay"), x(900, "Rahul", "everyone", "petrol"), x(1200, "Sam", "everyone", "food")],
	},
	{
		text: "Asha paid 600 for breakfast then Ben paid 900 for lunch",
		expenses: [x(600, "Asha", "everyone", "breakfast"), x(900, "Ben", "everyone", "lunch")],
	},
	{
		text: "Flat: rent 45000 monthly, maid 6000 monthly, gas 1100",
		group: "Flat",
		expenses: [x(45000, "me", "everyone", "rent", { monthly: true }), x(6000, "me", "everyone", "maid", { monthly: true }), x(1100, "me", "everyone", "gas")],
	},
	{
		text: "drinks and snacks 800, cab 400",
		expenses: [x(800, "me", "everyone", "drinks and snacks"), x(400, "me", "everyone", "cab")],
	},
	{
		text: "Coorg: Meera paid 7000 for the homestay and Vikram paid 1600 for fuel, split equally",
		group: "Coorg",
		expenses: [x(7000, "Meera", "everyone", "homestay"), x(1600, "Vikram", "everyone", "fuel")],
	},

	// Casual phrasing
	one("spent 1200 on groceries", 1200, "me", "everyone", "groceries"),
	one("got pizza for 700", 700, "me", "everyone", "pizza"),
	one("Paid 2,500 for concert tickets, split with Zoya", 2500, "me", ["me", "Zoya"], "concert tickets"),
	one("Swiggy order 640 with Dev and Sam", 640, "me", ["me", "Dev", "Sam"], "swiggy order"),
	one("Zomato 520 split equally with Neha", 520, "me", ["me", "Neha"], "zomato"),
	one("Bowling 1800, Ben paid, split between Ben, Kiran and me", 1800, "Ben", ["Ben", "Kiran", "me"], "bowling"),
	one("Yesterday's dinner 2200 split with Asha", 2200, "me", ["me", "Asha"], "dinner"),
	one("Water bill 450 monthly, split with Priya and Rahul", 450, "me", ["me", "Priya", "Rahul"], "water bill", { monthly: true }),
	one("Gym 2000 every month", 2000, "me", "everyone", "gym", { monthly: true }),
	one("Spotify 179 a month with Asha", 179, "me", ["me", "Asha"], "spotify", { monthly: true }),
	one("Cylinder ₹1100 monthly recurring", 1100, "me", "everyone", "cylinder", { monthly: true }),
	one("Tea 120", 120, "me", "everyone", "tea"),
	one("850", 850, "me", "everyone", ""),
	one("Asha 450 auto", 450, "Asha", "everyone", "auto"),
	one("paid 2k for the airbnb split between me, Kiran and Sam", 2000, "me", ["me", "Kiran", "Sam"], "airbnb"),
	one("Sam paid ₹1,240 for groceries split equally between Sam, Zoya and me", 1240, "Sam", ["Sam", "Zoya", "me"], "groceries"),
	one("Birthday cake for Asha 900 split with Ben and Kiran", 900, "me", ["me", "Ben", "Kiran"], "birthday cake for Asha"),
	one("Movie night 1600 split evenly with Meera, Dev", 1600, "me", ["me", "Meera", "Dev"], "movie night"),
];
