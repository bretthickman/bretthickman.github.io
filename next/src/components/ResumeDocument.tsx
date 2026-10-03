import './resume.css';
import { publicUrl } from '../public-url';

/** The original résumé as vector artwork, paired with its readable text. */
export function ResumeDocument() {
  return (
    <div className="resume-document">
      <img className="resume-page" src={publicUrl('/media/resume/resume.svg')} alt="" aria-hidden="true"
        width={595} height={842} decoding="async" />
      <article className="sr-only" aria-label="Brett Hickman's résumé">
        <h2>Brett Hickman</h2>
        <p>Programmer - Designer - Creator</p>
        <address>
          +1 949-486-9548<br />
          bretthickman.github.io<br />
          brett33hickman@gmail.com<br />
          32185 Fall River Road<br />
          Trabuco Canyon, CA 92679
        </address>

        <section>
          <h3>Profile</h3>
          <p>Experienced and self-motivated computer scientist with a passion for blending technology and artistic vision, seeking to make an impact in the field of creative computing.</p>
        </section>

        <section>
          <h3>Education</h3>
          <p>2018 - 2023</p>
          <p>Computer Science, California Polytechnic State University</p>
        </section>

        <section>
          <h3>Strengths</h3>
          <ul>
            <li>Extensive knowledge of C / C++</li>
            <li>Linear Algebra / 3D Math</li>
            <li>Java, Python, C#, Javascript</li>
            <li>Unity Development</li>
            <li>Computer Animation</li>
            <li>Graphics Pipeline / 3D Engines</li>
            <li>Debugging / Refactoring</li>
            <li>Inverse Kinematics</li>
            <li>Unix and Linux Development</li>
            <li>Time Management</li>
            <li>Collaboration</li>
            <li>Project Management</li>
          </ul>
        </section>

        <section>
          <h3>Projects</h3>
          <p>See my portfolio (linked above) for further details.</p>

          <section>
            <h4>Virtuosos</h4>
            <p>Timeline: 1 year</p>
            <p>A fully released rhythm / story game made in Unity</p>
            <ul>
              <li>Programmed rhythm detection and visual systems</li>
              <li>Designed animation systems with rigging and event triggers</li>
              <li>Collaborated with artists, animators, musicians, and writers</li>
            </ul>
            <p>Skills: Unity, Animation, C#, Teamwork</p>
          </section>

          <section>
            <h4>Gunfight</h4>
            <p>Timeline: 6 months +</p>
            <p>Online multiplayer shooter that is coming to Steam</p>
            <ul>
              <li>Independently acquired networking skills</li>
              <li>Task-focused Project Manager skilled at organizing</li>
              <li>Restructured my code for improved clarity and performance</li>
            </ul>
            <p>Skills: Networking, Leadership, Refactoring, Publishing</p>
          </section>

          <section>
            <h4>EXP</h4>
            <p>Timeline: 3 months</p>
            <p>3D game engine made with OpenGL and C++</p>
            <ul>
              <li>Engineered a particle system with multiple applications</li>
              <li>Incorporated shadow mechanics and spatial audio features</li>
              <li>Acquired an in-depth grasp of the graphics pipeline</li>
            </ul>
            <p>Skills: C++, Particles, Instancing, Graphics</p>
          </section>

          <section>
            <h4>Game Jams</h4>
            <p>Timeline: 48 hours/ea</p>
            <p>Multiple projects made within tight deadlines</p>
            <ul>
              <li>Prototyped and iterated on gameplay ideas quickly</li>
              <li>Embraced challenges posed by limited resources</li>
              <li>Composed dynamic music and sound effects</li>
            </ul>
            <p>Skills: Adaptation, Time Mgmt, Rapid Dev, Collaborate</p>
          </section>
        </section>

        <section>
          <h3>Work Experience</h3>
          <section>
            <h4>Technical Administrator</h4>
            <p>Immersive Learning Research Network - California</p>
            <p>6/24/23 - 6/30/23</p>
            <p>Supported XR conference tech issues and execution, ensuring smooth operation.</p>
          </section>
          <section>
            <h4>IT / Operations</h4>
            <p>Clearsource - California</p>
            <p>6/12/22 - 9/5/22</p>
            <p>Demonstrated multitasking skills, managing IT &amp; operational tasks collaboratively.</p>
          </section>
        </section>

        <section>
          <h3>Interests</h3>
          <ul>
            <li>D1 Track and Cross Country Running</li>
            <li>Graphic Design / Art</li>
            <li>Music Production</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
