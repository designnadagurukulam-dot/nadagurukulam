import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Music, User, Mail, Phone, Calendar, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import campusVerandah from "@/assets/campus/NGVerandah.jpg";

interface RegisterProps {
  roleType?: "student" | "educator";
}

const Register = ({ roleType = "student" }: RegisterProps) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Shared fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Student-specific
  const [rollNumber, setRollNumber] = useState("");
  const [courseName, setCourseName] = useState("");
  const [yearOfCommencement, setYearOfCommencement] = useState("");
  const [kycDocType, setKycDocType] = useState("");
  const [kycDocNumber, setKycDocNumber] = useState("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [availableCourses, setAvailableCourses] = useState<{ id: string; title: string }[]>([]);

  // Educator-specific
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isEducator = roleType === "educator";
  const dbRole = isEducator ? "instructor" : "student";

  useEffect(() => {
    if (!isEducator) {
      supabase.from("courses").select("id, title").eq("status", "approved").then(({ data }) => {
        if (data) setAvailableCourses(data);
      });
    }
  }, [isEducator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (!isEducator && !termsAccepted) {
      toast({ title: "Please accept the terms and conditions", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, displayName, dbRole);
    if (error) {
      setLoading(false);
      toast({ title: "Registration failed", description: error, variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Upload KYC document if provided (student)
      let kycDocUrl: string | null = null;
      if (!isEducator && kycFile) {
        const ext = kycFile.name.split(".").pop();
        const path = `${user.id}/kyc.${ext}`;
        const { data: uploadData } = await supabase.storage.from("kyc-documents").upload(path, kycFile, { upsert: true });
        if (uploadData) {
          kycDocUrl = uploadData.path;
        }
      }

      // Upload profile photo if provided (educator)
      let avatarUrl: string | null = null;
      if (isEducator && profilePhoto) {
        const ext = profilePhoto.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { data: uploadData } = await supabase.storage.from("profile-avatars").upload(path, profilePhoto, { upsert: true });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("profile-avatars").getPublicUrl(uploadData.path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const profileUpdate: Record<string, unknown> = {
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
      };

      if (isEducator) {
        profileUpdate.employee_id = employeeId || null;
        profileUpdate.designation = designation || null;
        profileUpdate.department = department || null;
        profileUpdate.qualifications = qualifications || null;
        profileUpdate.years_of_experience = yearsOfExperience ? parseInt(yearsOfExperience) : null;
        profileUpdate.specialization = specialization || null;
        if (avatarUrl) profileUpdate.avatar_url = avatarUrl;
      } else {
        profileUpdate.roll_number = rollNumber || null;
        profileUpdate.course_name = courseName || null;
        profileUpdate.year_of_commencement = yearOfCommencement ? parseInt(yearOfCommencement) : null;
        profileUpdate.kyc_document_type = kycDocType || null;
        profileUpdate.kyc_document_number = kycDocNumber || null;
        if (kycDocUrl) profileUpdate.kyc_document_url = kycDocUrl;
        profileUpdate.emergency_contact_name = emergencyName || null;
        profileUpdate.emergency_contact_phone = emergencyPhone || null;
      }

      await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);
    }

    setLoading(false);
    toast({ title: "Account created!", description: "Your account is pending approval." });
    navigate("/pending-approval");
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  const inputClass = "h-12 rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal placeholder:text-brand-warm-grey-light";

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden">
        <img src={campusVerandah} alt="Campus verandah walkway" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5C1219]/95 via-[#7D1E24]/88 to-[#5C1219]/85" />
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, hsl(40 56% 50% / 0.15), transparent, hsl(40 56% 50% / 0.15))", backgroundSize: "200% 200%" }}
        />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center w-full">
          <motion.img
            src={logo}
            alt="Nada Gurukulam"
            className="h-24 mb-10"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <h2 className="font-serif text-4xl font-bold text-brand-gold-light mb-4">
            {isEducator ? "Inspire & Teach" : "Begin Your"}<br />
            <span className="text-shimmer-gold">{isEducator ? "Classical Arts" : "Musical Journey"}</span>
          </h2>
          <p className="text-brand-warm-grey-light text-lg max-w-md leading-relaxed italic font-light">
            {isEducator
              ? "Join as a tutor and share your expertise in Indian classical arts."
              : "Join a community of passionate learners of Indian classical arts."}
          </p>
          <div className="mt-10 flex items-center gap-3 text-brand-gold/80">
            <Music className="h-5 w-5" />
            <span className="font-devanagari text-xl">रसो वै सः</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-start justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl py-8"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Nada Gurukulam" className="h-16" />
          </div>

          <h1 className="font-serif text-3xl text-foreground mb-2">
            {isEducator ? "Faculty Registration" : "Student Registration"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isEducator ? "Create your tutor account" : "Sign up to start your learning journey"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info Section */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Personal Information</h3>
              <div className="h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />Full Name</label>
                <Input placeholder="Your full name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />Email Address</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />Mobile Number</label>
                <Input type="tel" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Date of Birth</label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
              <Textarea placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal" rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">State</label>
                <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Pincode</label>
                <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Student-specific fields */}
            {!isEducator && (
              <>
                <div className="space-y-1 pt-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Academic Information</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Roll No / Registration No</label>
                    <Input placeholder="e.g. NG-2026-00001" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Course Applied For</label>
                    <Select value={courseName} onValueChange={setCourseName}>
                      <SelectTrigger className={inputClass}><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((c) => (
                          <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                        ))}
                        {availableCourses.length === 0 && (
                          <SelectItem value="general" disabled>No courses available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Year of Commencement</label>
                    <Select value={yearOfCommencement} onValueChange={setYearOfCommencement}>
                      <SelectTrigger className={inputClass}><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* KYC */}
                <div className="space-y-1 pt-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">KYC Verification</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Document Type</label>
                    <Select value={kycDocType} onValueChange={setKycDocType}>
                      <SelectTrigger className={inputClass}><SelectValue placeholder="Select document type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhaar">Aadhaar</SelectItem>
                        <SelectItem value="pan">PAN</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Document Number</label>
                    <Input placeholder="Document number" value={kycDocNumber} onChange={(e) => setKycDocNumber(e.target.value)} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-muted-foreground" />Upload Document (Image/PDF)</label>
                    <Input type="file" accept="image/*,.pdf" onChange={(e) => setKycFile(e.target.files?.[0] || null)} className={inputClass} />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1 pt-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Emergency Contact</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Name</label>
                    <Input placeholder="Emergency contact name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Number</label>
                    <Input type="tel" placeholder="+91 XXXXX XXXXX" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </>
            )}

            {/* Educator-specific fields */}
            {isEducator && (
              <>
                <div className="space-y-1 pt-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Professional Information</h3>
                  <div className="h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Employee ID</label>
                    <Input placeholder="e.g. EMP-001" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Designation</label>
                    <Select value={designation} onValueChange={setDesignation}>
                      <SelectTrigger className={inputClass}><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>
                        {designationOptions.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Department</label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className={inputClass}><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocal">Vocal</SelectItem>
                        <SelectItem value="instrumental">Instrumental</SelectItem>
                        <SelectItem value="dance">Dance</SelectItem>
                        <SelectItem value="visual_arts">Visual Arts</SelectItem>
                        <SelectItem value="theory">Theory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Years of Experience</label>
                    <Input type="number" placeholder="e.g. 10" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Qualifications</label>
                  <Textarea placeholder="Your educational qualifications" value={qualifications} onChange={(e) => setQualifications(e.target.value)} className="rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal" rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Specialization / Bio</label>
                  <Textarea placeholder="Your specialization and brief bio" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal" rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-muted-foreground" />Profile Photo</label>
                  <Input type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} className={inputClass} />
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1 pt-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Security</h3>
              <div className="h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Terms (student only) */}
            {!isEducator && (
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the Terms & Conditions and Privacy Policy of Nada Gurukulam.
                </label>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all" disabled={loading}>
              {loading ? "Creating account..." : isEducator ? "Register as Faculty" : "Register as Student"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
          <p className="text-center text-sm mt-3">
            {isEducator ? (
              <Link to="/register/student" className="text-muted-foreground hover:text-primary transition-colors">
                Register as Student instead →
              </Link>
            ) : (
              <Link to="/register/tutor" className="text-muted-foreground hover:text-primary transition-colors">
                Register as Faculty instead →
              </Link>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
