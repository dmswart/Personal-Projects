using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;

namespace ConsoleApplication1
{
    class Program
    {
        static Random r = new Random();
        enum Ball { Red = 0, Black, Yellow }
        static Ball pick()
        {
            //first choose number of Blacks
            int numBlacks = r.Next(61);

            //now choose ball index
            int choice = r.Next(90);
            if (choice < 30)
                return Ball.Red;
            else if (choice < 30 + numBlacks)
                return Ball.Black;
            else
                return Ball.Yellow;
        }

        static void Main(string[] args)
        {
            long red = 0;
            long black = 0;
            long redandyellow = 0;
            long blackandyellow = 0;

            for (long trial = 0; trial < 1000000; trial++)
            {
                Ball choice = pick();
                if (choice == Ball.Black)
                {
                    black++;
                    blackandyellow++;
                }
                else if (choice == Ball.Red)
                {
                    red++;
                    redandyellow++;
                }
                else
                {
                    redandyellow++;
                    blackandyellow++;
                }
            }
        }

    }
}
