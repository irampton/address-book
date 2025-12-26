import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureContactsTable, pool } from "./db.js";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

const app = express();

app.use( express.json() );

const allowedSorts = new Set( [
    "first_name",
    "last_name",
    "email",
    "phone",
    "notes",
] );

app.get( "/api/contacts", async ( req, res ) => {
    const sort = allowedSorts.has( req.query.sort ) ? req.query.sort : "last_name";
    const direction = req.query.direction === "desc" ? "DESC" : "ASC";

    try {
        const result = await pool.query(
            `SELECT * FROM contacts ORDER BY ${ sort } ${ direction }, id ASC`
        );
        res.json( result.rows );
    } catch ( error ) {
        console.error( "Failed to load contacts", error );
        res.status( 500 ).json( { error: "Failed to load contacts." } );
    }
} );

app.post( "/api/contacts", async ( req, res ) => {
    const payload = req.body || {};
    const fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "notes",
    ];
    const values = fields.map( ( field ) => payload[ field ] || null );

    if ( !payload.first_name && !payload.last_name ) {
        res.status( 400 ).json( { error: "Provide at least a first or last name." } );
        return;
    }

    try {
        const placeholders = fields.map( ( _, index ) => `$${ index + 1 }` ).join( ", " );
        const result = await pool.query(
            `INSERT INTO contacts (${ fields.join( ", " ) }) VALUES (${ placeholders }) RETURNING *`,
            values
        );
        res.status( 201 ).json( result.rows[ 0 ] );
    } catch ( error ) {
        console.error( "Failed to create contact", error );
        res.status( 500 ).json( { error: "Failed to create contact." } );
    }
} );

app.put( "/api/contacts/:id", async ( req, res ) => {
    const payload = req.body || {};
    const id = Number( req.params.id );
    const fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "notes",
    ];
    const values = fields.map( ( field ) => payload[ field ] || null );

    if ( !id ) {
        res.status( 400 ).json( { error: "Invalid contact id." } );
        return;
    }

    if ( !payload.first_name && !payload.last_name ) {
        res.status( 400 ).json( { error: "Provide at least a first or last name." } );
        return;
    }

    try {
        const assignments = fields
            .map( ( field, index ) => `${ field } = $${ index + 1 }` )
            .join( ", " );
        const result = await pool.query(
            `UPDATE contacts SET ${ assignments } WHERE id = $${ fields.length + 1 } RETURNING *`,
            [ ...values, id ]
        );
        res.json( result.rows[ 0 ] );
    } catch ( error ) {
        console.error( "Failed to update contact", error );
        res.status( 500 ).json( { error: "Failed to update contact." } );
    }
} );

app.delete( "/api/contacts/:id", async ( req, res ) => {
    const id = Number( req.params.id );

    if ( !id ) {
        res.status( 400 ).json( { error: "Invalid contact id." } );
        return;
    }

    try {
        await pool.query( "DELETE FROM contacts WHERE id = $1", [ id ] );
        res.status( 204 ).end();
    } catch ( error ) {
        console.error( "Failed to delete contact", error );
        res.status( 500 ).json( { error: "Failed to delete contact." } );
    }
} );

ensureContactsTable().catch( ( error ) => {
    console.error( "Failed to ensure contacts table", error );
} );

if ( isProduction ) {
    const distPath = path.resolve( __dirname, "../dist" );

    app.use( express.static( distPath ) );

    app.get( "*", ( req, res ) => {
        res.sendFile( path.join( distPath, "index.html" ) );
    } );

    app.listen( port, () => {
        console.log( `Server listening on http://localhost:${ port }` );
    } );
} else {
    const { createServer } = await import("vite");
    const vite = await createServer( {
        server: { middlewareMode: true },
        appType: "spa",
    } );

    app.use( vite.middlewares );

    app.use( "/{*splat}", async ( req, res, next ) => {
        try {
            const url = req.originalUrl;
            const template = await vite.transformIndexHtml(
                url,
                "<!doctype html><html><head></head><body><div id=\"app\"></div><script type=\"module\" src=\"/src/main.js\"></script></body></html>"
            );
            res.status( 200 ).set( { "Content-Type": "text/html" } ).end( template );
        } catch ( error ) {
            vite.ssrFixStacktrace( error );
            next( error );
        }
    } );

    app.listen( port, () => {
        console.log( `Vite dev server running on http://localhost:${ port }` );
    } );
}
