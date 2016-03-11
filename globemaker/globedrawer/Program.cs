using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Drawing;
using DMSLib;

namespace globemaker
{

    class Program
    {
        static void Main(string[] args)
        {

	        //Usage
	        if( args.Count() != 3 && args.Count() != 2 )
	        {
		        Console.WriteLine( "Usage globedrawer <SkeletonName.skl> <OutputImg> [SourceImg]\n\n" );
		        return;
	        }

	        //Read in Skeleton
            Skeleton skel = new Skeleton( args[0] );

            //Read in Source image
            DMSImage source = null;
            if( args.Count() == 3 )
                source = new DMSImage(args[2]);

            bool bDrawAsSphere = false;
            Globedrawer drawer = new Globedrawer(1500, source, Color.Gray, skel, bDrawAsSphere);

            DMSImage output = new DMSImage(drawer);
            output.Save(args[1]);
        } /* main */

    }
}
