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

app.get( "/api/columns", async ( req, res ) => {
    try {
        const result = await pool.query( "SELECT columns FROM app_settings WHERE id = 1" );
        const columns = result.rows[ 0 ]?.columns || [];
        res.json( columns );
    } catch ( error ) {
        console.error( "Failed to load columns", error );
        res.status( 500 ).json( { error: "Failed to load columns." } );
    }
} );

app.put( "/api/columns", async ( req, res ) => {
    const payload = Array.isArray( req.body ) ? req.body : req.body?.columns;

    if ( !Array.isArray( payload ) ) {
        res.status( 400 ).json( { error: "Columns payload must be an array." } );
        return;
    }

    const columns = payload
        .map( ( column ) => {
            const key = String( column?.key || "" ).trim();
            const label = String( column?.label || "" ).trim();
            const type = String( column?.type || "text" ).trim();
            if ( !key || !label ) return null;
            const sanitized = {
                key,
                label,
                type,
                fullWidth: Boolean( column?.fullWidth ),
            };
            if ( column?.cellClass ) {
                sanitized.cellClass = String( column.cellClass );
            }
            return sanitized;
        } )
        .filter( Boolean );

    try {
        await pool.query(
            "INSERT INTO app_settings (id, columns, updated_at) VALUES (1, $1::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET columns = EXCLUDED.columns, updated_at = NOW()",
            [ JSON.stringify( columns ) ]
        );
        res.json( columns );
    } catch ( error ) {
        console.error( "Failed to save columns", error );
        res.status( 500 ).json( { error: "Failed to save columns." } );
    }
} );

app.get( "/api/contacts", async ( req, res ) => {
    try {
        const result = await pool.query( "SELECT id, data FROM contacts ORDER BY id ASC" );
        res.json( result.rows.map( ( row ) => ( { id: row.id, ...row.data } ) ) );
    } catch ( error ) {
        console.error( "Failed to load contacts", error );
        res.status( 500 ).json( { error: "Failed to load contacts." } );
    }
} );

app.post( "/api/contacts", async ( req, res ) => {
    const payload = req.body || {};
    const { id, ...data } = payload;

    try {
        const result = await pool.query(
            "INSERT INTO contacts (data) VALUES ($1) RETURNING id, data",
            [ data ]
        );
        res.status( 201 ).json( { id: result.rows[ 0 ].id, ...result.rows[ 0 ].data } );
    } catch ( error ) {
        console.error( "Failed to create contact", error );
        res.status( 500 ).json( { error: "Failed to create contact." } );
    }
} );

app.put( "/api/contacts/:id", async ( req, res ) => {
    const payload = req.body || {};
    const id = Number( req.params.id );

    if ( !id ) {
        res.status( 400 ).json( { error: "Invalid contact id." } );
        return;
    }

    const { id: payloadId, ...data } = payload;

    try {
        const result = await pool.query(
            "UPDATE contacts SET data = $1 WHERE id = $2 RETURNING id, data",
            [ data, id ]
        );
        res.json( { id: result.rows[ 0 ].id, ...result.rows[ 0 ].data } );
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
