using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class DMS
    {
        public static char[] Delimiters = { ',', '\t' };
        public const double EPSILON = (1.0e-8);

        public const double TAU = Math.PI * 2.0;
        public const double HALFTAU = TAU * 0.5;
        public const double QUARTERTAU = TAU * 0.25;
        public const double TWOTAU = TAU * 2.0;

        public static double FixAngle(double theta)
        {
            while (theta < -HALFTAU) theta += TAU;
            while (theta > HALFTAU) theta -= TAU;
            return theta;
        }
        public static double FixAnglePositive(double theta)
        {
            while (theta < 0) theta += TAU;
            while (theta > TAU) theta -= TAU;
            return theta;
        }

        /// <summary>
        /// evaluates continuous differentiable, ... smoothed function (using sin) (typically used for blending)
        /// f(x) = 1.0 if x >= 1.0
        /// f(x) = 0.0 if x <= 0.0
        /// </summary>
        /// <param name="x"></param>
        /// <returns></returns>
        public static double smooth(double x)
        {
            if (x <= 0.0)
                return 0.0;
            if (x >= 1.0)
                return 1.0;

            // 0 < x < 1

            x = (x - 0.5) * TAU; // -PI < x < PI

            x = Math.Sin(x); //-1 < x < 1

            x = (x + 1.0) / 2.0; //0 < x < 1

            return x;
        }

        #region StaticColorFunctions
        private static double GetTemp2(double s, double l)
        {
            double temp2;
            if (l < 0.5)  //<=??
                temp2 = l * (1.0 + s);
            else
                temp2 = l + s - (l * s);
            return temp2;
        }

        private static double GetColorComponent(double temp1, double temp2, double temp3)
        {
            temp3 = MoveIntoRange(temp3);
            if (temp3 < 1.0 / 6.0)
                return temp1 + (temp2 - temp1) * 6.0 * temp3;
            else if (temp3 < 0.5)
                return temp2;
            else if (temp3 < 2.0 / 3.0)
                return temp1 + ((temp2 - temp1) * ((2.0 / 3.0) - temp3) * 6.0);
            else
                return temp1;
        }
        private static double MoveIntoRange(double temp3)
        {
            if (temp3 < 0.0)
                temp3 += 1.0;
            else if (temp3 > 1.0)
                temp3 -= 1.0;
            return temp3;
        }
        public static System.Drawing.Color FromHSL(double h, double s, double l)
        {
            double r = 0, g = 0, b = 0;
            if (l != 0)
            {
                if (s == 0)
                    r = g = b = l;
                else
                {
                    double temp2 = GetTemp2(s, l);
                    double temp1 = 2.0 * l - temp2;
                    r = GetColorComponent(temp1, temp2, h + 1.0 / 3.0);
                    g = GetColorComponent(temp1, temp2, h);
                    b = GetColorComponent(temp1, temp2, h - 1.0 / 3.0);
                }
            }
            return System.Drawing.Color.FromArgb((int)(255 * r), (int)(255 * g), (int)(255 * b));
        }

        #endregion

    }
}
