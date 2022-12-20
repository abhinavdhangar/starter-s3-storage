import multer from 'multer'
import sharp from 'sharp'
import express from "express"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import crypto from 'crypto'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

import dotenv from 'dotenv'
const app = express()
dotenv.config()
const port = process.env.PORT || 3000
const bucketName = process.env.AWS_BUCKET_NAME 
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

app.post('/posts', upload.single('image'), async (req, res) => {
  const file = req.file 
  const caption = req.body.caption

  const fileBuffer = await sharp(file.buffer)
    .resize({ height: 360, width: 240, fit: "contain" })
    .toBuffer()

  // Configure the upload details to send to S3
  const fileName = generateFileName()
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileName,
    ContentType: file.mimetype
  }

  // Send the upload to S3
  await s3Client.send(new PutObjectCommand(uploadParams)).then(res=>{
    res.send(res.$metadata)
  })


})


app.get("/", async (req, res) => {
  let {key} = req.query

//  let url =  await getSignedUrl(
//       s3Client,
//     new  GetObjectCommand({
//         Bucket: bucketName,
//         Key: key
//       }),
//       { expiresIn: 60 }// 60 seconds
//     )
  let url = await s3Client.send( new  GetObjectCommand({
            Bucket: bucketName,
            Key: key
          }))

  res.send(url)
})

app.delete("/api/posts/delete", async (req, res) => {
  const {key } = req.query
  // const post = await prisma.posts.findUnique({where: {id}}) 

  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  }

   s3Client.send(new DeleteObjectCommand(deleteParams))

  // await prisma.posts.delete({where: {id}})
  res.send(post)
})

app.listen(port,()=>{console.log("server is running ")})