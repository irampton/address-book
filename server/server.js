import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

const app = express();

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
