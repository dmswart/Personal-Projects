using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class Transform
    {
        #region member variables
        private Rotation m_rotation;
        private Point3D m_translation;
        #endregion

        #region constructor
        public Transform()
        {
            m_rotation = new Rotation();
            m_translation = new Point3D();
        }

        public Transform(Rotation rotation, Point3D translation)
        {
            m_rotation = rotation;
            m_translation = translation;
        }

        public Transform(Transform A)
        {
            m_rotation = new Rotation(A.rotation);
            m_translation = new Point3D(A.translation);
        }
        #endregion

        #region Accessors
        public Rotation rotation
        {
            get { return m_rotation; }
            set { m_rotation = value; }
        }
        public Point3D translation
        {
            get { return m_translation; }
            set { m_translation = value; }
        }
        #endregion

        #region public functions
#if false
        public Transfrom operator * ( Transform A, Transform B )
        {
            //TODO
        }

        public Transform Inverse()
        {
            
        }
#endif

        public Point3D Apply(Point3D P)
        {
            return m_rotation.Rotate(P) + m_translation;
        }
        #endregion

    }
}
