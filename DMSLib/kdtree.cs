using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class kdtree
    {
        private class kdnode
        {
            public Point3D Pt;
            public int Idx;
            public kdnode Left;
            public kdnode Right;

            public kdnode(Point3D pt, int idx)
            {
                Pt = pt;
                Idx = idx;
                Left = null;
                Right = null;
            }

        }

        kdnode root;
        double mEpsilon;

        public kdtree( double epsilon)
        {
            root = null;
            mEpsilon = epsilon;
        }

        public kdtree() : this(DMS.EPSILON) { }

        /// <summary>
        /// inserts a point into the kd tree.
        /// </summary>
        /// <param name="pt"></param>
        /// <param name="idx"></param>
        /// <returns>returns true if successfully inserted, false if there's a duplicate value already</returns>
        public bool Insert(Point3D pt, int idx)
        {
            return InsertHelper(ref root, pt, idx);
        }

        private bool InsertHelper(ref kdnode node, Point3D pt, int idx)
        {
            if (node == null)
            {
                node = new kdnode(pt, idx);
                return true;
            }
            else if( Math.Abs(pt.X - node.Pt.X) < mEpsilon &&
                     Math.Abs(pt.Y - node.Pt.Y) < mEpsilon &&
                     Math.Abs(pt.Z - node.Pt.Z) < mEpsilon )
            {
                return false;
            }
            else 
            {
                if (pt.X < node.Pt.X)
                    return InsertHelper(ref node.Left, new Point3D(pt.Y, pt.Z, pt.X), idx);
                else
                    return InsertHelper(ref node.Right, new Point3D(pt.Y, pt.Z, pt.X), idx);
            }
        }



        /// <summary>
        /// Finds a point in the tree closer than epsilon, and returns its associated index
        /// </summary>
        /// <param name="pt">The point to find</param>
        /// <returns>returns the index of the found point, or -1 otherwise</returns>
        public int Find(Point3D pt)
        {
            return FindHelper(root, pt);
        }

        private int FindHelper(kdnode node, Point3D pt)
        {
            if (node == null)
            {
                return -1;
            }
            else if (Math.Abs(pt.X - node.Pt.X) < mEpsilon &&
                     Math.Abs(pt.Y - node.Pt.Y) < mEpsilon &&
                     Math.Abs(pt.Z - node.Pt.Z) < mEpsilon)
            {
                return node.Idx;
            }
            else if (pt.X < node.Pt.X - mEpsilon)
            {
                return FindHelper(node.Left, new Point3D(pt.Y, pt.Z, pt.X));
            }
            else if (pt.X > node.Pt.X + mEpsilon)
            {
                return FindHelper(node.Right, new Point3D(pt.Y, pt.Z, pt.X));
            }
            else
            {
                int leftresult = FindHelper(node.Left, new Point3D(pt.Y, pt.Z, pt.X));
                if (leftresult != -1)
                    return leftresult;
                return FindHelper(node.Right, new Point3D(pt.Y, pt.Z, pt.X));
            }
        }
    }
}
