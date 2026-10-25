import 'dotenv/config';

import app from './app.js';
import {connectDB} from './config/db.js';

const port = process.env.PORT || 4000;

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`ThreatLens API listening on port ${port}`);
    });
})
.catch((error) => {
    console.error('ThreatLens failed to start:', error.message);
    process.exitCode = 1;
});
