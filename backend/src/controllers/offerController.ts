import { Request, Response } from "express";

export const createOffer = async (req: Request, res: Response) => {
    try{
        console.log("Post create offer router is called")
    }catch(error){
        console.log("Creat Offer Error: ", error);
        res
        .status(400)
        .json({
            error: error
        })
    }
}