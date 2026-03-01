import pinataSDK from "@pinata/sdk"; 
 
 const pinata = new pinataSDK({ 
   pinataJWTKey: process.env.PINATA_JWT!, 
 }); 
 
 /* ========================== 
    Upload Certificate Image 
 ========================== */ 
 export async function uploadFile( 
   buffer: Buffer, 
   filename: string 
 ) { 
   const { Readable } = require("stream");
   const readableStream = Readable.from(buffer); 
 
   const result = await pinata.pinFileToIPFS( 
     readableStream, 
     { 
       pinataMetadata: { 
         name: filename, 
       }, 
     } 
   ); 
 
   return result.IpfsHash; 
 } 
 
 /* ========================== 
    Upload Metadata JSON 
 ========================== */ 
 export async function uploadJSON(data: any) { 
   const result = await pinata.pinJSONToIPFS(data); 
   return result.IpfsHash; 
 } 
