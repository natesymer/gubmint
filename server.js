const {Pool} = require("pg");
const http = require('http');

async function runGubmint() {
	// Reads the same environment vars as libpq
	const pg = new Pool();

	function serveJSON(res, obj, statusCode=200) {
		res.writeHead(statusCode, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(obj));
	}

	async function geocodeAddress(addressString) {
		const x = await pg.query(`SELECT g.rating as rating, ST_Y(g.geomout) as lat,ST_X(g.geomout) as lon, (addy).* FROM geocode($1) As g LIMIT 1`, [addressString]);
		const res = x.rows;
		if (res.length > 0) {
			const {lat, lon, rating} = res[0];
			const accuracy = (100 - rating) / 100;
			console.log(`Geocoded "${addressString}" to (${lat}, ${lon}) (accuracy: ${accuracy}%)`);
			return {lat, lon, accuracy};
		}
		console.log(`Failed to geocode "${addressString}".`);
		return null;
	}

	const app = http.createServer(async (req, res) => {
		try {
			const url = new URL(req.url, 'http://localhost');
			const addressString = url.searchParams.get('address');
			const coord = await geocodeAddress(addressString);

			if (coord) {
				serveJSON(res, {coordinates: coord, error: null});
			} else {
				serveJSON(res, {error: "Address not found."}, 404);
			}
		} catch (e) {
			serveJSON(res, {error: e.toString()}, 500);
		}
	});

	const port = process.env.GUBMINT_PORT ?? 5001;
	app.listen(port);
	console.log(`Gubmint geocoder running on port ${port}.`);
}

runGubmint();
