﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class Bookball : Renderer
    {
        #region constants
        Point3D[] Positions = new Point3D[92]
            { new Point3D(0.2319284,0.1389806,0.9727329),
              new Point3D(-0.01318484,0.2700603,0.9727329),
              new Point3D(-0.2443637,0.1157271,0.9727329),
              new Point3D(-0.2172871,-0.1609121,0.9727329),
              new Point3D(0.2319284,-0.3474105,0.9727329),
              new Point3D(0.6328167,-0.1609121,0.7700428),
              new Point3D(0.6569803,0.1157271,0.7578256),
              new Point3D(0.450672,0.2700603,0.8621356),
              new Point3D(0.4118671,0.524768,0.7578256),
              new Point3D(-0.03494478,0.7157612,0.7792039),
              new Point3D(-0.4610267,0.4821517,0.7578256),
              new Point3D(-0.4748357,0.2248753,0.8621356),
              new Point3D(-0.807821,-0.07906707,0.6796085),
              new Point3D(-0.4222218,-0.3126766,0.8621356),
              new Point3D(-0.3587899,-0.5623929,0.7578256),
              new Point3D(-0.09402938,-0.6461487,0.7700428),
              new Point3D(0.4313637,-0.6461487,0.6447735),
              new Point3D(0.6621283,-0.5623929,0.5144084),
              new Point3D(0.7658016,-0.3126766,0.5788755),
              new Point3D(0.9153902,-0.1791742,0.3863585),
              new Point3D(0.9295636,0.3067204,0.4031479),
              new Point3D(0.5815764,0.6106627,0.5551356),
              new Point3D(0.4862954,0.8008226,0.3761854),
              new Point3D(0.2267217,0.8942775,0.4100984),
              new Point3D(-0.3127563,0.8679392,0.4100984),
              new Point3D(-0.561992,0.7496433,0.3761854),
              new Point3D(-0.6382961,0.5511063,0.5551356),
              new Point3D(-0.8192969,0.3588645,0.4682782),
              new Point3D(-0.7341657,-0.5109127,0.4682782),
              new Point3D(-0.519325,-0.6644108,0.5551356),
              new Point3D(-0.3209764,-0.9793389,0.2419992),
              new Point3D(-0.00485529,-0.8271609,0.5788755),
              new Point3D(0.2655267,-0.8271609,0.5144084),
              new Point3D(0.3398819,-0.9141271,0.2610892),
              new Point3D(0.7527863,-0.7409091,0.07113717),
              new Point3D(0.9528016,-0.3029775,0.1403188),
              new Point3D(0.9961858,-0.1420654,-0.08213905),
              new Point3D(0.9996924,0.1335024,-0.04591079),
              new Point3D(0.7933841,0.6216485,0.05839917),
              new Point3D(0.5952976,0.8064762,0.120551),
              new Point3D(0.3209764,0.9793389,-0.2419992),
              new Point3D(0.09090658,0.9880731,0.186449),
              new Point3D(-0.1867239,0.9745186,0.186449),
              new Point3D(-0.3170919,0.9567434,-0.05839917),
              new Point3D(-0.7527863,0.7409091,-0.07113717),
              new Point3D(-0.9137039,0.3760884,0.2074084),
              new Point3D(-0.9961858,0.1420654,0.08213905),
              new Point3D(-0.9795717,-0.09587751,0.2248609),
              new Point3D(-0.9497342,-0.3325262,0.08213905),
              new Point3D(-0.8234415,-0.5461149,0.2074084),
              new Point3D(-0.6928012,-0.732814,0.04822608),
              new Point3D(0.1396282,-0.9961493,0.08663801),
              new Point3D(0.1867239,-0.9745186,-0.186449),
              new Point3D(0.431396,-0.8720954,-0.2695602),
              new Point3D(0.8102012,-0.4943842,-0.3442004),
              new Point3D(0.9227997,-0.2405687,-0.3314862),
              new Point3D(0.807821,0.07906707,-0.6796085),
              new Point3D(0.9296135,0.2949013,-0.2610892),
              new Point3D(0.8234415,0.5461149,-0.2074084),
              new Point3D(0.6537036,0.6597031,-0.3959533),
              new Point3D(-0.1624182,0.953533,-0.289328),
              new Point3D(-0.2655267,0.8271609,-0.5144084),
              new Point3D(-0.5174473,0.7111833,-0.4957643),
              new Point3D(-0.8861738,0.3523188,-0.3314862),
              new Point3D(-0.982018,0.1298329,-0.1951912),
              new Point3D(-0.9295636,-0.3067204,-0.4031479),
              new Point3D(-0.6958805,-0.6953107,-0.2271762),
              new Point3D(-0.4862954,-0.8008226,-0.3761854),
              new Point3D(-0.2855458,-0.9378397,-0.2413213),
              new Point3D(-0.03208251,-0.9445109,-0.3552261),
              new Point3D(0.03494478,-0.7157612,-0.7792039),
              new Point3D(0.4433524,-0.7454871,-0.5167237),
              new Point3D(0.6382961,-0.5511063,-0.5551356),
              new Point3D(0.5887621,-0.3507883,-0.7413652),
              new Point3D(0.5997871,0.5156204,-0.6274605),
              new Point3D(0.3587899,0.5623929,-0.7578256),
              new Point3D(0.1854095,0.7505892,-0.6492725),
              new Point3D(-0.08652481,0.7227204,-0.6996458),
              new Point3D(-0.2319284,0.3474105,-0.9727329),
              new Point3D(-0.5760447,0.4973583,-0.6634176),
              new Point3D(-0.7658016,0.3126766,-0.5788755),
              new Point3D(-0.7481168,0.05280211,-0.675906),
              new Point3D(-0.571274,-0.4571647,-0.6956738),
              new Point3D(-0.4221694,-0.678266,-0.6172874),
              new Point3D(0.3471003,-0.3562388,-0.878596),
              new Point3D(0.2443637,-0.1157271,-0.9727329),
              new Point3D(0.3891294,0.1165623,-0.9242874),
              new Point3D(0.2503795,0.3570264,-0.910581),
              new Point3D(-0.5416803,-0.007617117,-0.8519625),
              new Point3D(-0.450672,-0.2700603,-0.8621356),
              new Point3D(-0.1878216,-0.3146939,-0.9407478),
              new Point3D(-0.03092203,-0.09434697,-1.004718) };

              int[,] Faces = new int[60,3]
              { {4, 3, 0},
                {4, 0, 5},
                {4, 5, 16},
                {4, 16, 15},
                {4, 15, 3},
                {9, 8, 1},
                {9, 1, 10},
                {9, 10, 24},
                {9, 24, 23},
                {9, 23, 8},
                {12, 11, 13},
                {12, 13, 28},
                {12, 28, 47},
                {12, 47, 27},
                {12, 27, 11},
                {20, 19, 6},
                {20, 6, 21},
                {20, 21, 38},
                {20, 38, 37},
                {20, 37, 19},
                {30, 29, 31},
                {30, 31, 51},
                {30, 51, 68},
                {30, 68, 50},
                {30, 50, 29},
                {34, 33, 17},
                {34, 17, 35},
                {34, 35, 54},
                {34, 54, 53},
                {34, 53, 33},
                {40, 39, 41},
                {40, 41, 60},
                {40, 60, 76},
                {40, 76, 59},
                {40, 59, 39},
                {44, 43, 25},
                {44, 25, 45},
                {44, 45, 63},
                {44, 63, 62},
                {44, 62, 43},
                {56, 55, 57},
                {56, 57, 74},
                {56, 74, 86},
                {56, 86, 73},
                {56, 73, 55},
                {65, 64, 48},
                {65, 48, 66},
                {65, 66, 82},
                {65, 82, 81},
                {65, 81, 64},
                {70, 69, 71},
                {70, 71, 84},
                {70, 84, 90},
                {70, 90, 83},
                {70, 83, 69},
                {78, 77, 79},
                {78, 79, 88},
                {78, 88, 91},
                {78, 91, 87},
                {78, 87, 77} };


        #endregion

        #region member variables
        int nRectWidth;
        int nRectHeight;
        DMSImage m_overlay;
        #endregion

        public Bookball( Size size, DMSImage source, Color Background, DMSImage overlay )
            : base( new Size(size.Width,size.Width*3/4), source, Background ) 
        {
            nRectWidth = size.Width / 10;
            nRectHeight = nRectWidth * 5 / 4;
            m_overlay = overlay;
        }


        override public Color GetPixel(int x, int y)
        {
            Color result = m_Blank;
            //which face are we in?
			int i = y * 6 / m_Size.Height;
			int j = x * 10 / m_Size.Width;
			int nFace = i*10+j;

            //which pixel of the face are we in?
			int u = x % nRectWidth;
			int v = y % nRectHeight;

			Point3D A = Positions[Faces[nFace,0]];
			Point3D I = Positions[Faces[nFace,1]];
			Point3D D = Positions[Faces[nFace,2]];

            //subtract off A, I and D are in A's frame of reference
            I = I-A;
            D = D-A;

            Point3D K = A + (D * -0.29381236) + (I * 0.702658371);
            Point3D KC = (D * 0.675004476) + (I * -0.968117701);
            Point3D KG = (D * 0.956034402) + (I * 0.410124463);
	
            KC.Scale( 1.0 / nRectWidth);
            KG.Scale( 1.0 / nRectHeight);
            Point3D finalpos = K + (KC * u) + (KG * v);

            finalpos.Z *= -1.0;  // we need a mirror version to look right.
            finalpos.Normalize();
            result = m_Source.GetSpherePixel(finalpos);

            //deal with overlay
            if (m_overlay != null)
            {
                Color overlayColor = m_overlay.GetPixel(x, y);
                int transparency = overlayColor.A;
                result = Color.FromArgb((overlayColor.R * transparency + result.R * (255 - transparency)) / 255,
                                        (overlayColor.G * transparency + result.G * (255 - transparency)) / 255,
                                        (overlayColor.B * transparency + result.B * (255 - transparency)) / 255);
            }

            return result;
        }
    }
}
